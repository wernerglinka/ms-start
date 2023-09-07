<p align="center">
  <img alt="Metalsmith First" src="https://github.com/wernerglinka/ms-start/blob/main/msstart.png?raw=true" width="100" />
</p>

<h1 align="center">MS-START</h1>

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square&label=license)](http://opensource.org/licenses/MIT)
[![NPM](http://img.shields.io/npm/v/ms-start.svg?style=flat-square&label=npm)](https://npmjs.org/package/ms-start)


**ms-start** is a command-line interface (CLI) tool designed for creating the foundational structure of Markdown source pages in the context of Metalsmith, a static site generator. It is specifically tailored to work seamlessly with the Metalsmith First starter, streamlining the process of building static websites.

**ms-start** simplifies the setup process by providing the `init` command. When executed, this command retrieves the [Metalsmith First](https://github.com/wernerglinka/metalsmith-first) starter from GitHub and integrates it into the local project directory. Additionally, it facilitates the creation of one or more pages. Users are guided through an interactive prompt, allowing them to define the page frontmatter, which is subsequently applied to the corresponding page file.

## Quick Start Guide

To get started quickly, follow these steps:

1. Initialize a new project with **ms-start** by running the following command:

```bash
npx ms-start init my-site
```

2. Change your current directory to the newly created project folder:

```bash
cd my-site
```

3. Launch the development server:

```bash
npm start
```

4. Visit [http://localhost:3000/](http://localhost:3000/) in your web browser to view the home page of the Metalsmith First starter. No additional installations or configurations are required, making it easy to start building your website.

## Comprehensive Overview

To provide a more detailed understanding of the process, please consider the following steps:

1. Ensure that you have Node.js version 18 or higher installed on your system.

2. Open your terminal and navigate to the local directory where you intend to create your static website.

3. Execute the following command to initialize a new project using **ms-start**:

```bash
npx ms-start init my-site
```

This command accomplishes the following tasks:

- **ms-start** clones the Metalsmith First starter repository into the "my-site" directory.
- It installs all necessary dependencies.
- A new Git repository is initialized for version control.

Once these operations are complete, your project structure will resemble the following:

```
my-site
├── lib
│   ├── assets
│   ├── data
│   ├── layouts
│   ├── scripts
│   └── styles
├── local_modules
├── node_modules
├── nunjucks-filters
├── src
│   ├── 404.html
│   └── index.md
├── .eslintrc.js
├── .gitignore
├── .prettierignore
├── .prettierrc
├── LICENSE
├── metalsmith.js
├── msstart.png
├── package.json
└── README.md
```

At this point, you can navigate to your "my-site" directory and initiate a development server using the following command:

```bash
cd my-site
npm start
```

This will make your site's home page accessible at [http://localhost:3000](http://localhost:3000) in your web browser.

Should you need to create a production-ready version of your site, you can do so with the following command:

```bash
npm run build
```

The production-ready site will be generated in the "build" folder. This approach ensures you have both a development environment for iterative work and a production-ready version for deployment.

## Available Methods

### `init <site name>`

This method facilitates the creation of a new project directory with the specified `<site name>`. Additionally, it clones the Metalsmith First starter into the newly created project directory.

### `addPages`

The `addPages` method simplifies the process of creating pages while offering the flexibility to add sections via user prompts. These pages are stored within the source directory. Any sections included are automatically integrated into the respective page's frontmatter. Basic style sheets are deposited in the `/assets/styles/` directory, and any required scripts are placed in the `/assets/scripts/` directory.

### `addSectionTo <page name>`

The `addSectionTo` method allows the seamless addition of sections to an existing page. Similar to the `addPages` method, any sections added are also included in the page's frontmatter. Basic style sheets are located in the `/assets/styles/` directory, and any necessary scripts are found in the `/assets/scripts/` directory.

### `buildNav`

With the `buildNav` method, a JSON object is generated to represent the hierarchical structure of the site's pages. This JSON object is then stored in the `/assets/data/` directory, providing an organized overview of the site's page structure.


## License

Code released under [the MIT license](https://github.com/wernerglinka/ms-start/blob/master/LICENSE).

[npm-badge]: https://img.shields.io/npm/v/ms-start.svg
[npm-url]: https://www.npmjs.com/package/ms-start
[license-badge]: https://img.shields.io/github/license/wernerglinka/ms-start
[license-url]: LICENSE
