// sidepanel.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log("RepoMind Side Panel Loaded");

    // State
    let currentOwner = '';
    let currentRepo = '';
    let currentBranch = 'main';
    let repoData = null;
    let treeData = null;

    // Initialize mermaid
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    }

    // 1. Get Context (URL)
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab && tab.url) {
        const parts = tab.url.split('/');
        if (parts.length >= 5 && parts[2] === 'github.com') {
            currentOwner = parts[3];
            currentRepo = parts[4];
            DOM.setText('repo-name', `${currentOwner}/${currentRepo}`);

            loadData();
        } else {
            DOM.setText('repo-name', 'Not a GitHub Repo');
            DOM.setHTML('readme-summary', "<p>Please navigate to a GitHub repository.</p>");
        }
    }

    async function loadData() {
        try {
            // Fetch Details
            repoData = await ghApi.getRepoDetails(currentOwner, currentRepo);
            DOM.setText('repo-branch', repoData.default_branch);
            currentBranch = repoData.default_branch;

            // Update Overview
            DOM.setText('stat-stars', repoData.stargazers_count);

            // Fetch README (Summary)
            try {
                const readme = await ghApi.getReadme(currentOwner, currentRepo);
                const content = atob(readme.content);
                DOM.setHTML('readme-summary', content.substring(0, 300) + "...");
            } catch (e) {
                DOM.setText('readme-summary', "No README found.");
            }

            // Load Tree (Mind Map)
            treeData = await ghApi.getRepoTree(currentOwner, currentRepo, currentBranch);
            renderMindMap();
            populateFileExplorer();

            // Load Languages (Stats)
            const langs = await ghApi.getLanguages(currentOwner, currentRepo);
            renderCharts(langs);

            // Fetch Additional Stats
            const contributors = await ghApi.getContributors(currentOwner, currentRepo);
            DOM.setText('stat-contributors', contributors.length + (contributors.length >= 10 ? "+" : ""));

            const commits = await ghApi.getCommits(currentOwner, currentRepo, currentBranch, 1);
            // Hint: GitHub API doesn't give total count easily, but we can display the latest SHA or just "Active"
            DOM.setText('stat-commits', "100+"); // Simplified for now

        } catch (err) {
            console.error(err);
            DOM.setHTML('readme-summary', `<p style="color:red">Error loading repo: ${err.message}</p>`);
        }
    }

    function renderMindMap() {
        if (!treeData || typeof mermaid === 'undefined') return;
        const graphDefinition = MindMap.generateMermaid(treeData);
        const element = document.getElementById('mermaid-graph');

        // Clear and Render
        element.innerHTML = graphDefinition;
        element.removeAttribute('data-processed');

        mermaid.run({
            nodes: [element]
        });
    }

    function renderCharts(langs) {
        if (typeof Chart === 'undefined') return;
        const ctx = document.getElementById('langChart').getContext('2d');

        const labels = Object.keys(langs);
        const data = Object.values(langs);

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#f1e05a', '#2b7489', '#563d7c', '#e34c26', '#3178c6', '#860432']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right', labels: { color: '#c9d1d9' } }
                }
            }
        });

        // Populate Tech stack list
        DOM.createList('tech-stack-list', labels.slice(0, 5));
    }

    function populateFileExplorer() {
        const select = document.getElementById('file-select');
        if (!treeData) return;

        // Filter for files
        const files = treeData.tree.filter(i => i.type === 'blob');

        files.forEach(file => {
            const opt = document.createElement('option');
            opt.value = file.path;
            opt.textContent = file.path;
            select.appendChild(opt);
        });

        select.addEventListener('change', async (e) => {
            const path = e.target.value;
            if (!path) return;

            DOM.setText('file-explanation', "Analyzing...");
            const content = await ghApi.getFileContent(currentOwner, currentRepo, path);

            const mode = document.getElementById('mode-toggle').value;
            const explanation = CodeAnalyzer.analyze(path, content, mode);

            DOM.setText('file-explanation', explanation);
        });
    }

    // Event Listeners

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // PPT
    document.getElementById('btn-generate-ppt').addEventListener('click', async () => {
        if (!repoData) return;

        const btn = document.getElementById('btn-generate-ppt');
        const originalText = btn.textContent;
        btn.textContent = "⏳ Generating...";
        btn.disabled = true;

        try {
            const pptMode = document.getElementById('ppt-mode').value;
            await PPTGenerator.generate({
                owner: currentOwner,
                name: currentRepo,
                repo: `${currentOwner}/${currentRepo}`,
                description: repoData.description,
                default_branch: currentBranch,
                pptMode: pptMode,
                stats: {
                    stars: repoData.stargazers_count,
                    forks: repoData.forks_count,
                    issues: repoData.open_issues_count,
                    watchers: repoData.subscribers_count
                }
            }, treeData);
        } catch (err) {
            console.error(err);
            alert("Failed to generate PPT: " + err.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // Mode Toggle
    document.getElementById('mode-toggle').addEventListener('change', () => {
        // Re-trigger analysis if a file is selected
        const select = document.getElementById('file-select');
        if (select.value) {
            select.dispatchEvent(new Event('change'));
        }
    });

    document.getElementById('refresh-map').addEventListener('click', () => {
        renderMindMap();
    });

});
