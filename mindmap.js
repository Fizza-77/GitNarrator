// mindmap.js

const MindMap = {
    /**
     * Converts a GitHub Tree API response to Mermaid Syntax
     * @param {Object} treeData Response from git/trees?recursive=1
     * @param {number} maxNodes Limit nodes to prevent freezing
     */
    generateMermaid: (treeData, maxNodes = 100) => {
        if (!treeData || !treeData.tree) return "graph LR\nRoot[Start Analysis]";

        let syntax = ["graph LR"];
        const files = treeData.tree;

        // 1. Process paths into a Set of edges
        // Limit depth to 2 or 3 to avoid visual clutter
        // Filter out node_modules, .git, .vscode, assets, etc.
        const ignorePatterns = ['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode', 'assets', 'images', 'test'];

        let nodes = new Set();
        let edges = new Set();
        let count = 0;

        // Root node
        syntax.push(`root[Repository]`);
        syntax.push(`style root fill:#f9f,stroke:#333,stroke-width:2px`);

        for (const item of files) {
            if (count > maxNodes) break;
            if (item.type !== 'tree' && item.type !== 'blob') continue;

            const parts = item.path.split('/');

            // Filter ignored
            if (parts.some(p => ignorePatterns.includes(p))) continue;
            // Limit depth for clarity
            if (parts.length > 3) continue;

            // Build edges: root -> dir1 -> dir2 -> file
            let parent = 'root';

            parts.forEach((part, index) => {
                const id = parts.slice(0, index + 1).join('_').replace(/[\-\.\s]/g, '_'); // Sanitized ID
                const label = part;

                if (!nodes.has(id)) {
                    // Verify if it's a folder (tree) or file (blob)
                    // We infer from path position. Last item might be file.
                    // Or we check the original item if it matches the full path.

                    let shape = '[ ]'; // Rect (default)
                    if (index === parts.length - 1 && item.type === 'blob') {
                        shape = '([ ])'; // Rounded (File)
                    } else {
                        shape = '{{ }}'; // Hex (Folderish)
                    }

                    syntax.push(`${id}${shape.replace(' ', label)}`);
                    nodes.add(id);
                    count++;
                }

                const edge = `${parent} --> ${id}`;
                if (!edges.has(edge)) {
                    syntax.push(edge);
                    edges.add(edge);
                }

                parent = id;
            });
        }

        return syntax.join('\n');
    }
};
