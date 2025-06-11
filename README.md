# react-highlight-html

# HighlightableHTML

A React component that allows users to highlight text in HTML content, attach notes, and manage highlights through a sidebar. Ideal for learning tools, annotation features, and in-browser text review workflows.

## ✨ Features

- ✅ Highlight arbitrary selections within raw HTML content
- 📝 Add and edit notes attached to each highlight
- 🧠 Persist highlights via `sessionStorage`
- 🔍 View and jump to highlights in a side drawer
- 🧼 Unhighlight text with a single click
- ⚙️ Smooth scroll to focused highlights
- 📦 Built with [Ant Design](https://ant.design/) and `React`

---

## 📦 Installation

```bash
npm install your-package-name
# or
yarn add your-package-name
⚠️ Make sure to also install required peer dependencies like antd, react, and clsx if not already present.

🔧 Usage

import React from 'react';
import HighlightableHTML from 'your-package-name/HighlightableHTML';

const htmlContent = `<p>This is an example paragraph. You can highlight any part of this.</p>`;

const App = () => {
  return (
    <HighlightableHTML
      initialHTML={htmlContent}
      storageKey="demo-highlight-session"
      isShowNote={true}
      className="prose max-w-none"
    />
  );
};
export default App;

🧾 Props

Prop	Type	Required	Description
initialHTML	string	✅	Raw HTML content to display and annotate.
storageKey	string	✅	Key used to persist highlights in sessionStorage.
isShowNote	boolean	❌	Enable or disable notes UI for each highlight (default: false).
className	string	❌	Optional CSS class for styling the content container.

🖱️ Interaction Features

Highlight Text: Select any text and click "Highlight this" from the popover.

Add Notes: Click the speech bubble icon to attach a note to a highlight.

Remove Highlight: Click "Unhighlight this" to delete a highlight.

Manage All Highlights: Use the bottom-right icon to open a drawer listing all current highlights.

📁 Storage Behavior

All highlights and modified HTML are stored in sessionStorage under the provided storageKey. Data resets on session end (tab close or reload).

🧠 Internals

Uses window.getSelection() and DOM Range to detect and map offsets.

Highlights are restored using character offsets to preserve HTML structure.

UI positioning is handled via Popover and Modal from Ant Design.

Animated scroll and focus highlighting use window.scrollTo() and temporary CSS styles.

🔒 Limitations

Currently designed for static or mostly-static HTML content.

Not optimized for dynamic content changes after mounting.

Uses dangerouslySetInnerHTML – ensure sanitized input to prevent XSS vulnerabilities.

🧪 Development

Clone the repo and start development:

git clone https://github.com/your-user/your-repo.git
cd your-repo
npm install
npm start

📄 License

MIT

🙌 Acknowledgments

Ant Design
clsx
```
