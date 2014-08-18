<h1 class="styleguide-title styleguide-title-main">Style Guide Overview</h1>

This "living" style guide is automatically generated from comments in working SCSS files/modules. It is intended to be an evolving document, not a static record.

<h2 class="kss-title">Implemention Notes</h2>

This particular implementation utilizes the node.js version of KSS (KSS-node: https://github.com/hughsk/kss-node), which compiles single line (double slash) comments in SCSS/CSS files into styleguide markup. Basic markdown formatting is supported. Multi-line (/\* comments \*/) are ignored. The styleguide should be re-compiled to update. A grunt task has been configured for this.

Overall structure is set up in the standalone peapodLivingStyleGuide.scss file, which imports appropriate SCSS modules.

Comments in SCSS modules should adhere to the following general structure (each element followed by an extra commented out line)

- section title
- any comments
- markup, to display variants
- Section number (e.g. Styleguyide 3.1)

This overview is written in the styleguide.md markdown file in the source directory (/shop/site/src) 

<h2 class="kss-title">Compilation</h2>

Grunt tasks have been created to compile and output the html documents/pages and relevant CSS. 

To compile only the HTML files:
    <pre><code>grunt shell:kssnodeCompile</code></pre>

To compile only the styleguide-related CSS files:
    <pre><code>grunt compass:styleguide</code></pre>

To compile all styleguide files:
    <pre><code>grunt compilestyleguide</code></pre>