// ppt-generator.js

const PPTGenerator = {
    generate: async (data, treeData) => {
        if (typeof PptxGenJS === 'undefined') {
            alert("PptxGenJS library not found. Please add it to assets/libs.");
            return;
        }

        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';
        pptx.author = 'RepoMind AI';
        pptx.company = 'RepoMind';
        pptx.subject = `Analysis of ${data.repo}`;

        const colors = {
            bg: "0d1117",     // Darker GitHub
            text: "c9d1d9",
            accent: "58a6ff", // Blue
            codeBg: "161b22",
            white: "FFFFFF"
        };

        // Master Slide Definition
        pptx.defineSlideMaster({
            title: "MASTER_SLIDE",
            background: { color: colors.bg },
            objects: [
                { line: { x: 0.5, y: 0.8, w: '90%', h: 0.05, line: colors.accent, lineSize: 1 } },
                { rect: { x: 0, y: 7.2, w: '100%', h: 0.3, fill: colors.codeBg } },
                { text: { text: "GitNarrator | Codebase Insight", x: 0.5, y: 7.25, fontSize: 10, color: colors.text } },
                { text: { text: `© ${new Date().getFullYear()}`, x: 11.5, y: 7.25, fontSize: 10, color: colors.text, align: 'right' } }
            ]
        });

        const createSlide = (title) => {
            let slide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
            slide.addText(title, { x: 0.5, y: 0.3, fontSize: 24, fontFace: "Segoe UI", color: colors.accent, bold: true });
            return slide;
        };

        // 1. TITLE SLIDE
        let titleSlide = pptx.addSlide();
        titleSlide.background = { color: colors.bg };
        titleSlide.addText(data.repo, { x: 1, y: 2.5, w: '80%', fontSize: 42, color: colors.white, bold: true, align: "center" });
        titleSlide.addText(data.pptMode === 'advanced' ? "Technical Architecture & Roadmap" : "Project Overview & Features", { x: 1, y: 3.5, w: '80%', fontSize: 20, color: colors.accent, align: "center" });
        titleSlide.addText(`Generated on ${new Date().toLocaleDateString()}`, { x: 1, y: 4.2, w: '80%', fontSize: 12, color: "8b949e", align: "center" });

        // 2. EXECUTIVE SUMMARY
        let execSlide = createSlide("Executive Summary");
        const description = data.description || "A software project hosted on GitHub.";
        execSlide.addText(description, { x: 0.5, y: 1.2, w: '90%', fontSize: 16, color: colors.text });

        const metrics = [
            { text: `• Stars: ${data.stats.stars}`, options: { breakLine: true } },
            { text: `• Forks: ${data.stats.forks}`, options: { breakLine: true } },
            { text: `• Watchers: ${data.stats.watchers}`, options: { breakLine: true } },
            { text: `• Open Issues: ${data.stats.issues}`, options: { breakLine: true } }
        ];
        execSlide.addText(metrics, { x: 0.5, y: 3.0, fontSize: 16, color: colors.white });

        if (data.pptMode === 'advanced') {
            await PPTGenerator._addAdvancedSlides(pptx, data, treeData, colors, createSlide);
        } else {
            await PPTGenerator._addBasicSlides(pptx, data, treeData, colors, createSlide);
        }

        // FINAL SLIDE: ROADMAP
        let roadSlide = createSlide("Recommendations & Roadmap");
        let languages = Object.keys(await ghApi.getLanguages(data.owner, data.name)).slice(0, 3).join(", ");
        let roadPrompt = `Suggest 3 professional improvements for a GitHub project using ${languages}. Format as bullet points.`;
        let roadmap = await AIService.generate(roadPrompt) || "• Enhance unit test coverage.\n• Improve API documentation.\n• Optimize performance for scale.";

        roadSlide.addText(roadmap.replace(/\*\*/g, "").replace(/\-/g, "•"), { x: 0.5, y: 1.5, w: '90%', fontSize: 16, color: colors.text });

        pptx.writeFile({ fileName: `GitNarrator-${data.name}-${data.pptMode}.pptx` });
    },

    _addBasicSlides: async (pptx, data, treeData, colors, createSlide) => {
        // Feature Inference
        let featSlide = createSlide("Core Features");
        let languages = Object.keys(await ghApi.getLanguages(data.owner, data.name)).join(", ");
        let featPrompt = `Based on these languages: ${languages} and description: ${data.description}, list 4 key features this project likely provides.`;
        let features = await AIService.generate(featPrompt) || "• Modular codebase design\n• Automated build process\n• Integrated documentation\n• Version-controlled development";

        featSlide.addText(features.replace(/\*\*/g, "").replace(/\-/g, "•"), { x: 0.5, y: 1.5, w: '90%', fontSize: 16, color: colors.text });

        // Simple Tech Stack
        let techSlide = createSlide("Technology Stack");
        const langs = await ghApi.getLanguages(data.owner, data.name);
        let techText = Object.entries(langs).slice(0, 5).map(([l, v]) => `• ${l}`).join("\n");
        techSlide.addText(techText, { x: 0.5, y: 1.5, fontSize: 20, color: colors.white });
    },

    _addAdvancedSlides: async (pptx, data, treeData, colors, createSlide) => {
        // 1. Architecture Overview
        let archSlide = createSlide("Architecture & Patterns");
        const archType = CodeAnalyzer.detectArchitecture(treeData);
        archSlide.addText(`Detected Pattern: ${archType}`, { x: 0.5, y: 1.2, fontSize: 18, color: colors.white, bold: true });

        let archDetails = await AIService.generate(`Explain the benefits of ${archType} for a developer in 3 bullet points.`) || "• Promotes scalability\n• Simplifies maintenance\n• Enhances code reuse";
        archSlide.addText(archDetails.replace(/\*\*/g, "").replace(/\-/g, "•"), { x: 0.5, y: 2.5, w: '90%', fontSize: 16, color: colors.text });

        // 2. Development History (Commits)
        let commitSlide = createSlide("Recent Development Activity");
        const commits = await ghApi.getCommits(data.owner, data.name, data.default_branch, 5);
        let commitText = commits.map(c => `• ${c.commit.author.date.split('T')[0]}: ${c.commit.message.substring(0, 50)}... (${c.commit.author.name})`).join("\n");
        commitSlide.addText(commitText, { x: 0.5, y: 1.2, w: '90%', fontSize: 13, color: colors.text, fontFace: "Courier New" });

        // 3. Branch Strategy
        let branchSlide = createSlide("Branching & Governance");
        const branches = await ghApi.getBranches(data.owner, data.name);
        let branchList = branches.slice(0, 10).map(b => `• ${b.name}${b.name === data.default_branch ? " (Default)" : ""}`).join("\n");
        branchSlide.addText(`Total Branches: ${branches.length}`, { x: 0.5, y: 1.2, fontSize: 14, color: colors.accent });
        branchSlide.addText(branchList, { x: 0.5, y: 1.8, fontSize: 12, color: colors.text });

        // 4. Component Deep Dive (Picking one critical file)
        let deepDiveSlide = createSlide("Core Module Analysis");
        let coreFile = treeData.tree.find(f => f.path.includes('index.js') || f.path.includes('main.py') || f.path.includes('App.js')) || treeData.tree[0];
        if (coreFile && coreFile.type === 'blob') {
            try {
                const content = await ghApi.getFileContent(data.owner, data.name, coreFile.path);
                const analysis = await CodeAnalyzer.analyze(coreFile.path, content, 'advanced');
                deepDiveSlide.addText(`File: ${coreFile.path}`, { x: 0.5, y: 1.2, fontSize: 14, color: colors.accent });
                deepDiveSlide.addText(analysis.substring(0, 1000), { x: 0.5, y: 1.8, w: '90%', h: 4, fontSize: 12, color: colors.text, rect: { fill: colors.codeBg } });
            } catch (e) {
                deepDiveSlide.addText("Analysis skipped (file too large or unreachable).", { x: 0.5, y: 1.5 });
            }
        }
    }
};
