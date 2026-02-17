// code-analyzer.js

const CodeAnalyzer = {

    analyze: async (fileName, content, mode = 'beginner') => {
        const ext = fileName.split('.').pop().toLowerCase();

        // Try GenAI First
        const prompt = mode === 'beginner'
            ? `Explain this ${ext} file for a beginner student in 2-3 sentences: \n\n${content.substring(0, 1000)}`
            : `Provide an advanced technical summary of this ${ext} file, highlighting patterns and logic: \n\n${content.substring(0, 1000)}`;

        const aiResult = await AIService.generate(prompt);
        if (aiResult) return "✨ AI Analysis:\n" + aiResult;

        // Fallback to Heuristics
        if (mode === 'beginner') {
            return CodeAnalyzer.beginnerExplanation(fileName, ext, content);
        } else {
            return CodeAnalyzer.advancedExplanation(fileName, ext, content);
        }
    },

    beginnerExplanation: (name, ext, content) => {
        const map = {
            'js': "This is a JavaScript file. It likely adds interactivity or logic to the application.",
            'json': "This is a data file. It stores settings or information in a structured format.",
            'html': "This is the structure of a web page.",
            'css': "This file controls how the website looks (colors, fonts, etc).",
            'md': "This is a documentation file, usually explained the project."
        };

        let summary = map[ext] || "This is a source code file.";

        // Simple heuristic
        if (content.includes('import ') || content.includes('require(')) {
            summary += "\n\nIt imports other files to work together.";
        }

        return summary;
    },

    advancedExplanation: (name, ext, content) => {
        let details = `**File Analysis: ${name}**\n\n`;
        const lines = content.split('\n').length;
        details += `- **Lines of Code**: ${lines}\n`;

        // Heuristics
        if (ext === 'js' || ext === 'ts') {
            const functions = (content.match(/function\s+\w+/g) || []).length;
            const consts = (content.match(/const\s+\w+/g) || []).length;
            const classes = (content.match(/class\s+\w+/g) || []).length;

            details += `- **Functions**: ${functions}\n`;
            details += `- **Classes**: ${classes}\n`;
            details += `- **Constants**: ${consts}\n`;

            if (content.includes('react')) {
                details += `\n**Framework Detection**: React.js detected (Components, Hooks).`;
            }
            if (content.includes('express')) {
                details += `\n**Framework Detection**: Express.js server logic.`;
            }
        }

        if (ext === 'py') {
            const defs = (content.match(/def\s+\w+/g) || []).length;
            details += `- **Functions (def)**: ${defs}\n`;
        }

        return details;
    },

    detectArchitecture: (treeData) => {
        if (!treeData || !treeData.tree) return "Generic Architecture";
        const paths = treeData.tree.map(item => item.path);

        if (paths.some(p => p.includes('models/')) && paths.some(p => p.includes('views/')) && paths.some(p => p.includes('controllers/'))) {
            return "MVC (Model-View-Controller) Pattern";
        }
        if (paths.some(p => p.includes('src/components')) || paths.some(p => p.includes('src/pages'))) {
            return "Component-based Architecture (Modern Web)";
        }
        if (paths.some(p => p.includes('src/main/java'))) {
            return "Layered Enterprise Architecture (Java)";
        }
        if (paths.some(p => p.includes('api/')) && paths.some(p => p.includes('web/'))) {
            return "Full-Stack Decoupled Architecture";
        }
        return "Standard Modular Structure";
    }
};
