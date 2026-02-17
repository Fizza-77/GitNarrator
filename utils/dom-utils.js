// utils/dom-utils.js

const DOM = {
    // Safe helper to set text content
    setText: (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    // Safe helper to set innerHTML (be careful with XSS, only use for trusted content)
    setHTML: (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    },

    // Show/Hide loader or elements
    setVisible: (id, isVisible) => {
        const el = document.getElementById(id);
        if (el) el.style.display = isVisible ? 'block' : 'none';
    },

    // Add list items
    createList: (parentId, items) => {
        const parent = document.getElementById(parentId);
        if (!parent) return;
        parent.innerHTML = ''; // Clear
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            parent.appendChild(li);
        });
    }
};
