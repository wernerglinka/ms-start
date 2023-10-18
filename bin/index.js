#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const { Command } = require('commander');
const { readFileSync, writeFileSync, copySync, readdirSync, mkdirSync, removeSync, existsSync, lstatSync } = require('fs-extra');
const path = require('path');
const getDirName = require('path').dirname;
const YAML = require('json-to-pretty-yaml');
const yamlParse = require('js-yaml');
const fm = require('front-matter');
const color = require('ansi-colors');
let inquirer;
let boxen;

// get the initial page object
const page = require('../templates/page');
const { get } = require('http');

/**
 * Icons
 */
const checkmark = '\u2713';
const exclamation = '\u0021';
const warning = '\u26A0';

const space = '\u0020';


/**
 * Load ES Modules
 */
async function loadInquirer() {
	if (!inquirer) {
		inquirer = (await import('inquirer')).default;
	}
	return inquirer;
}

async function loadBoxen() {
	if (!boxen) {
		boxen = (await import('boxen')).default;
	}
	return boxen;
}

/**
 * File Operations
 */
function writeFile(path, contents) {
	mkdirSync(getDirName(path), { recursive: true });
	writeFileSync(path, contents);
}

function checkFileExists(value) {
	return existsSync(`${process.cwd()}/${value}`);
}

/**
 * @function processDirectory
 * @param {*} dirPath 
 * @param {*} page 
 * @param {*} navItem 
 * @returns 
 * @description recursively processes a directory and returns an array of objects
 * @description each object represents a directory or a file
 * @description Used when a file path is specified, e.g. /src/about/
 */
function processDirectory(dirPath, page, navItem) {
	const subItems = [];
	const items = readdirSync(dirPath);

	items.forEach(item => {
		const itemPath = path.join(dirPath, item);
		const stats = lstatSync(itemPath);

		if (stats.isDirectory()) {
			const subNavItem = {};
			subNavItem[item] = processDirectory(itemPath, page, subNavItem);
			subItems.push(subNavItem);
		} else if (stats.isFile() && item.endsWith('.md')) {
			const itemContent = readFileSync(itemPath, 'utf8');
			const { body, attributes } = fm(itemContent);
			const parsedBody = yamlParse.load(body.substring(4, body.length - 4));

			subItems.push({
				name: path.basename(item, '.md'),
				url: itemPath.replace(`${process.cwd()}/src`, '').replace('.md', ''),
				navLabel: parsedBody.pageNavLabel
			});
		}
	});

	return subItems;
}

/**
 * @function getAssociatedLayouts
 * @param {*} sectionTemplate 
 * @returns array of associated layouts
 */
function getAssociatedLayouts(sectionName) {
	const dependencies = require('../dependencies/layouts.js');
	const sectionDependencies = dependencies[sectionName];
	
	return sectionDependencies ? sectionDependencies : false;
}
/**
 * @function getAssociatedScripts
 * @param {*} sectionTemplate 
 * @returns array of associated scripts
 */
function getAssociatedScripts(sectionName) {
	const dependencies = require('../dependencies/scripts.js');
	const sectionDependencies = dependencies[sectionName];
	
	return sectionDependencies ? sectionDependencies : false;
}
/**
 * @function getAssociatedStyles
 * @param {*} sectionTemplate 
 * @returns array of associated styles
 */
function getAssociatedStyles(sectionName) {
	const dependencies = require('../dependencies/styles.js');
	const sectionDependencies = dependencies[sectionName];
	
	return sectionDependencies ? sectionDependencies : false;
}

/**
 * Messages
 */
function userMsg(msg, bold) {
	bold ?
		console.log(checkmark, color.bold.green(msg))
	:
		console.log(checkmark, color.green(msg));
}

function userHint(msg) {
	console.log(color.blue(msg));
}

function userWarning(msg) {
	console.log(exclamation, color.bold.red(msg));
}

function lineSpacer() {
	console.log("\n");
}

/**
 * CLI Commands
 */

/**
 * @function init
 * @param {*} projectName
 * @returns void
 * @description clones the Metalsmith-First repository
 * @description removes the .git folder
 * @description initializes a new git repository
 * @description starts a development server
 * @description displays a welcome message
 */
async function init(projectName) {
	await loadInquirer();
	const boxen = await loadBoxen();
	const welcomeMsg = color.bold.green("Welcome to Metalsmith First!\nms-start will help you get started with Metalsmith and structured content.");

	console.log(boxen(welcomeMsg, {padding: 1, borderColor: 'green', borderStyle: 'double', dimBorder: true}));

	const repoUrl = 'https://github.com/wernerglinka/metalsmith-first';
	
	// check if directory with project name already exists
	if (checkFileExists(projectName)) {
		userWarning(`A directory with the name "${projectName}" already exists.`);
		userHint("Please delete the directory or choose a different name.")
		lineSpacer();
		return;	
	}

	// ask if we should add blogging functionality
	const { addBlog } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'addBlog',
			message: 'Do you want to add blogging functionality?',
			default: false
		}
	]);

	// Clone the repository
	execSync(`git clone ${repoUrl} ${projectName}`);
	userMsg(`Cloned the Metalsmith-First repository`, true);

	// Navigate into the new project director
	const projectPath = path.join(process.cwd(), projectName);
	process.chdir(projectPath);

	// Run npm install
	execSync('npm install');
	userMsg(`Installed npm packages for ${projectName}`, true);
	
	// Remove the .git folder
	removeSync(path.join(projectPath, '.git'));

	// Initialize a new git repository
	execSync('git init');
	userMsg(`Initialized new git repository`, true);

	// add blog functionality if requested
	if (addBlog) {
		await addBlogFunctionality();
		userMsg(`Added blogging functionality`, true);
	}
}

async function addBlogFunctionality() {
	const msPath = process.cwd(); // path to the site we are building
	const libPath = getDirName(__dirname); // path to the root of this tool

	//get the blog template url and copy to the project layouts folder
	const blogLandingPage = `${libPath}/blog-functionality/blog-list.njk`;
	const target = `${msPath}/lib/layouts/blog-list.njk`;
	copySync(blogLandingPage, target);
	userMsg(`blog-list.njk was written to /lib/layouts/`, true);
}

/**
 * @function addPage
 * @returns void
 * @description adds pages to the site
 * @description adds sections to the pages
 * @description writes the pages to the src folder
 */
async function addPages() {
	await loadInquirer();
	const boxen = await loadBoxen();

	const msPath = process.cwd(); // path to the site we are building
	const libPath = getDirName(__dirname); // path to the root of this tool

	console.log(boxen(`Adding pages with structured content to your site.`, {padding: 1, borderColor: 'green', borderStyle: 'double', dimBorder: true}));

	let numberOfPages = 0;
	let buildPages = true;
	let pageParams = {};

	while (buildPages) {
		// is this a blog page?
		const { isBlogPage } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'isBlogPage',
				message: 'Is this a blog page?',
				default: false
			}
		]);

		page.isBlogpost = isBlogPage;

		pageParams = await collectPageData(pageParams, isBlogPage);
		page.sections = await handleSectionData(pageParams, libPath, msPath);

		// write page file
		const yamlData = createFrontmatterForPage(page);
		const target = `${msPath}${pageParams.pagesPath}${pageParams.pageFileName}.md`;

		// check if file path exists and create it if it doesn't
		if (!existsSync(`${msPath}${pageParams.pagesPath}`)) {
			mkdirSync(`${msPath}${pageParams.pagesPath}`, { recursive: true });
		}
		writeFileSync(target, yamlData);
		numberOfPages++;
		userMsg(`Source page ${pageParams.pageFileName}.md was written to ${pageParams.pagesPath}.`, true);
		lineSpacer();

		const { addAnotherPage } = await askToAddAnotherPage();
		buildPages = addAnotherPage;
	}
	userMsg(`${numberOfPages} Page${numberOfPages > 1 ? 's' : ''} ha${numberOfPages > 1 ? 've' : 's'} been added to ${pageParams.pagesPath}`, true);
	lineSpacer();
}

/**
 * @function addSection
 * @param {*} pageName
 * @returns void
 * @description adds sections to an existing page
 */
async function addSectionTo(pageName) {
	const boxen = await loadBoxen();

	const msPath = process.cwd(); // path to the site we are building
	const libPath = getDirName(__dirname); // path to the root of this tool

	console.log(boxen(`Adding one or more sections to ${pageName}.`, {padding: 1, borderColor: 'green', borderStyle: 'double', dimBorder: true}));

	const targetPage = `${msPath}/src/${pageName}.md`;
	const pageContent = readFileSync(targetPage, 'utf8');
	const { body, attributes } = fm(pageContent);
	const parsedPageBody = yamlParse.load(body.substring(4, body.length - 4));

	// make sure there is a sections array defined
	parsedPageBody.sections = parsedPageBody.sections ? parsedPageBody.sections : [];
	
	const sections = await getSections(libPath, msPath);

  // add new sections to the existing page sections array
	parsedPageBody.sections = [...parsedPageBody.sections, ...sections];

	// transform the page body back to yaml
	const yamlData = createFrontmatterForPage(parsedPageBody);

	// write page file
	writeFileSync(targetPage, yamlData);
	userMsg(`Source page ${pageName} was updated.`, true);
}

/**
 * @function nav
 * @returns void
 * @description builds the navigation object from the pages and writes it to the nav.json file
 */
async function buildNav() {
	const boxen = await loadBoxen();
	console.log(boxen(`Building the Navigation.\nAssuming the use of the permalink plugin\nand the use of markdown files for pages.`, {padding: 1, borderColor: 'green', borderStyle: 'double', dimBorder: true}));

	// check if we have any pages to build the nav from
	const pagesPath = `${process.cwd()}/src/`;
	const pages = readdirSync(pagesPath);

	if (pages.length === 0) {
		userWarning('No pages found in the src folder.');
		return;
	} else {
		// build the nav oject from the pages
		const nav = [];
		pages.forEach(page => {

			// if file does not end with .md and is not a directory, skip it
			if (!page.endsWith('.md') && !lstatSync(`${pagesPath}${page}`).isDirectory()) return;

			// if file is a directory, process it
			if (lstatSync(`${pagesPath}${page}`).isDirectory()) {

				const navItem = {};
				navItem[page] = processDirectory(`${pagesPath}${page}`, `${page}`, navItem);
				nav.push(navItem);

			} else {
				// if file is not a directory, process it
				const pageName = page.replace('.md', '');

				// eliminate the '---' from the beginning and end of the file
				const fileContent = readFileSync(`${pagesPath}${page}`, 'utf8');
				const trimmedFileContent = fileContent.substring(4, fileContent.length - 4);
				const parsedFileBody = yamlParse.load(fm(trimmedFileContent).body);

				nav.push({
					name: pageName,
					url: `/${pageName}`,
					nav: {
						label: parsedFileBody.pageNavLabel,
						order: parsedFileBody.pageNavOrder,
						icon: parsedFileBody.pageNavIcon
					}
				});
			}
		});

		// write the nav object to the nav.json file
		const navData = JSON.stringify(nav);
		const target = `${process.cwd()}/lib/data/nav.json`;
		writeFile(target, navData);
		userMsg(`nav.json was written to /lib/data/`, true);
	}
}

/**
 * @function buildDefaults
 * @param {*} pageParams
 * @returns pageParams
 * @description builds the default values object
 */
function buildDefaults(pageParams) {
	return {
		pagesPath: pageParams.pagesPath ? pageParams.pagesPath : '/src/',
		pageFileName: pageParams.pageFileName ? pageParams.pageFileName : 'index',
		pageNavLabel: pageParams.pageNavLabel ? pageParams.pageNavLabel : 'label',
		pageNavOrder: pageParams.pageNavOrder ? pageParams.pageNavOrder : '1',
		pageNavIcon: pageParams.pageNavIcon ? pageParams.pageNavIcon : '',
		pageTemplate: pageParams.pageTemplate ? pageParams.pageTemplate : 'sections.njk',
		bodyClasses: pageParams.bodyClasses ? pageParams.bodyClasses : '',
		metaTitle: pageParams.metaTitle ? pageParams.metaTitle : 'My page',
		metaDescription: pageParams.metaDescription ? pageParams.metaDescription : '',
		canonicalOverwrite: pageParams.canonicalOverwrite ? pageParams.canonicalOverwrite : ''
	};
}

async function getBlogData() {
	await loadInquirer();

	return blogParams = await inquirer.prompt([
		{
			name: 'blogTitle',
			type: 'input',
			message: 'Title for the blog page?',
			default: ""
		},
		{
			name: 'blogDate',
			type: 'input',
			message: 'Date for the blog page?',
			default: () => {
				const today = new Date();
				return `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
			}
		},
		{
			name: 'blogAuthor',
			type: 'input',
			message: 'Author for the blog page?',
			default: ""
		},
		{
			name: 'blogImageSource',
			type: 'input',
			message: 'Image source for the blog page?',
			default: ""
		},
		{
			name: 'blogImageAlt',
			type: 'input',
			message: 'Image alt for the blog page?',
			default: ""
		},
		{
			name: 'blogImageCaption',
			type: 'input',
			message: 'Image caption for the blog page?',
			default: ""
		},
		{
			name: 'blogExcerpt',
			type: 'input',
			message: 'Excerpt for the blog page?',
			default: ""
		}
	]);
}


/**
 * @function collectPageData
 * @param {*} pageParams
 * @returns pageParams
 * @description collects data from the user to build the page object
 */
async function collectPageData(pageParams, isBlogPage) {
	await loadInquirer();
	let goOn = false;

	while (!goOn) {
		const defaults = buildDefaults(pageParams);

		pageParams = await inquirer.prompt([
			{
				type: 'input',
				name: 'pagesPath',
				message: 'Path to store the page?',
				default: isBlogPage ? `${defaults.pagesPath}blog/` : defaults.pagesPath,
				validate: (input) => {
					if (!input.trim().startsWith('/src/'))  {
						return 'pagesPath must start with "/src/"';
					}
					return true;
				}
			},
			{
				type: 'input',
				name: 'pageNavLabel',
				message: 'Nav label for the page?',
				default: defaults.pageNavLabel,
				validate: (input) => {
					if (input.trim() === '') {
						return 'pageNavLabel cannot be empty.';
					}
					return true;
				}
			},
			{
				type: 'input',
				name: 'pageNavOrder',
				message: 'Nav order for the page?',
				default: defaults.pageNavOrder,
			},
			{
				type: 'input',
				name: 'pageNavIcon',
				message: 'Nav icon for the page?',
				default: defaults.pageNavIcon,
			},
			{
				type: 'input',
				name: 'pageFileName',
				message: 'Page file name?',
				default: defaults.pageFileName,
				validate: (input) => {
					if (input.trim() === '') {
						return 'pageFileName cannot be empty.';
					}
					return true;
				}
			},
			{
				type: 'input',
				name: 'pageTemplate',
				message: 'Page template?',
				default: defaults.pageTemplate,
				validate: (input) => {
					if (input.trim() === '') {
						return 'pageTemplate cannot be empty.';
					}
					return true;
				}
			},
			{
				name: 'bodyClasses',
				type: 'input',
				message: 'Body classes for this page?',
				default: defaults.bodyClasses
			},
			{
				name: 'metaTitle',
				type: 'input',
				message: 'Meta title for this page?',
				default: defaults.metaTitle
			},
			{
				name: 'metaDescription',
				type: 'input',
				message: 'Meta description for this page?',
				default: defaults.metaDescription
			},
			{
				name: 'canonicalOverwrite',
				type: 'input',
				message: 'Enter a canonical URL for this page if you want to overwrite the default!',
				default: defaults.canonicalOverwrite
			}
		]);

		// if this is a blog page, add the blog properties
		if (isBlogPage) {
			blogParams = await getBlogData();
			pageParams = {...pageParams, ...blogParams};
		}

		// check if file already exists and prompt for new file name
		if (checkFileExists(`${pageParams.pagesPath}/${pageParams.pageFileName}.md`)) {
			const pageName = await askForPageName(defaults, pageParams);
			pageParams.pageFileName = pageName.pageFileName;
		}

		mergePageParams(pageParams, isBlogPage);

		displayPageParams(pageParams, isBlogPage);

		goOn = (await confirmDetails()).proceed;
	}
	return pageParams;
}

function kebabToCamel(input) {
  return input.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * @function getSections
 * @param {*} libPath 
 * @param {*} msPath 
 * @returns sections
 * @description collects data from the user to build the page sections array
 */
async function getSections(libPath, msPath) {
	const sections = [];
	const sectionTemplates = readdirSync(`${libPath}/templates/sections`).map(item => item.replace('.js', ''));

	let addAnotherSection = true;

	while (addAnotherSection) {
		const selectedTemplate = await selectSectionTemplate(sectionTemplates);

		// compose section template from selected template and common fields
		const sectionTemplate = require(`../templates/sections/${selectedTemplate.sectionTemplate}.js`);
		const commonFields = require('../templates/common.js');
		commonFields.name = selectedTemplate.sectionTemplate;

		// push the new section to the page sections array
		const newSection = Object.assign({}, commonFields, sectionTemplate);
		sections.push(newSection);

		// copy the section layout to the layouts folder if it doesn't exist
		copySectionLayout(selectedTemplate.sectionTemplate, libPath, msPath);

		// copy the basic section styles to the styles folder if it doesn't exist
		copySectionStyles(selectedTemplate.sectionTemplate, libPath, msPath);

		// copy any section scripts to the scripts folder if they don't exist
		copySectionScripts(selectedTemplate.sectionTemplate, libPath, msPath);

		userMsg(`Section files were written`, true);
		lineSpacer();

		// ask if another section should be added
		addAnotherSection = (await askToAddAnotherSection()).addAnotherSection;
	}
	return sections;
}

/**
 * @function copySectionLayout
 * @param {*} sectionName 
 * @param {*} libPath 
 * @param {*} msPath
 * @returns void
 * @description copies the section layout into the target layouts folder if it doesn't exist
 */
function copySectionLayout(sectionName, libPath, msPath) {
	//look-up associated layouts. Returns false if no layouts are registerred for the selected section template
	const associatedLayouts = getAssociatedLayouts(sectionName);
	// copy the section layout to the layouts folder if it doesn't exist
	if (associatedLayouts) {
		// write the associated layouts to the layout folder if they don't exist
		const targetLayoutsFolder = `${msPath}/lib/layouts/sections/`;
		
		associatedLayouts.forEach(layout => {
			const sectionLayout = `${libPath}/layouts/${layout}.njk`;
			const targetLayout = `${targetLayoutsFolder}${layout}.njk`;

			if (!existsSync(targetLayout)) {
				copySync(sectionLayout, targetLayout);
				userMsg(`${layout}.njk was written to ${targetLayoutsFolder.replace(msPath, "")}.`, true);
			}
		});	
	}
}

/**
 * @function copySectionStyles
 * @param {*} sectionName 
 * @param {*} libPath 
 * @param {*} msPath
 * @returns void
 * @description copies the section styles into the target styles folder if it doesn't exist
 */
function copySectionStyles(sectionName, libPath, msPath) {
	//look-up associated styles. Returns false if no styles are registerred for the selected section template
	const associatedStyles = getAssociatedStyles(sectionName);
	// copy the section styles to the styles folder if it doesn't exist
	if (associatedStyles) {
		// write the associated styles to the styles folder if they don't exist
		const targetStylesFolder = `${msPath}/lib/styles/components/`;
		
		associatedStyles.forEach(style => {
			const sectionStyles = `${libPath}/template-styles/${style}.css`;
			const targetStyles = `${targetStylesFolder}${style}.css`;

			if (!existsSync(targetStyles)) {
				copySync(sectionStyles, targetStyles);
				userMsg(`${style}.css was written to ${targetStylesFolder.replace(msPath, "")}.`, true);
			}

			// update the main styles file
			const mainStyles = `${msPath}/lib/styles/main.css`;
			const mainStylesContent = readFileSync(mainStyles, 'utf8');

			// add entry to main.css if it doesn't exist
			if (!mainStylesContent.includes(`@import "./components/${style}.css";`)) {
				const newStyles = `${mainStylesContent}\n@import "./components/${style}.css";`;
				writeFile(mainStyles, newStyles);
				userMsg(`${style}.css was added to ${mainStyles.replace(msPath, "")}.`, true);
			}
		});	
	}

};

/**
 * @function insertLineAfter
 * @param {*} fileContent
 * @param {*} tag
 * @param {*} newLine
 * @returns fileContent
 * @description inserts a new line after the specified tag
 * @example insertLineAfter(fileContent, '// end imports', 'import newScript from "./components/newScript.js";');
 */
function insertLineAfter(fileContent, tag, newLine) {
	const lines = fileContent.split('\n');
	const indexOfInsertion = lines.findIndex(line => line.includes(tag));

	if (indexOfInsertion !== -1) {
		lines.splice(indexOfInsertion, 0, newLine);
		return lines.join('\n');
	}

	return fileContent;
};
/**
 * @function copySectionScripts
 * @param {*} sectionName
 * @param {*} libPath
 * @param {*} msPath
 * @returns void
 * @description copies the section scripts into the target scripts folder if they don't exist
 * @description adds the section scripts to the main.js file if they are not already present
 * @description adds the youtube api script to the main.js file if the section includes a video and the api is not present
 */
function copySectionScripts(sectionName, libPath, msPath) {
	//look-up associated scripts. Returns false if no scripts are registerred for the selected section template
	const associatedScripts = getAssociatedScripts(sectionName);

	if (associatedScripts) {
		// write the associated scripts to the scripts folder if they don't exist
		const targetScriptsFolder = `${msPath}/lib/scripts/components/`;
		associatedScripts.forEach(script => {
			const sectionScript = `${libPath}/template-scripts/${script}.js`;
			const targetScript = `${targetScriptsFolder}${script}.js`;

			if (!existsSync(targetScript)) {
				copySync(sectionScript, targetScript);
				userMsg(`${script}.js was written to ${targetScriptsFolder.replace(msPath, "")}.`, true);
			}
		});

		// update main.js with the associated scripts
		const mainScript = `${msPath}/lib/scripts/main.js`;
		let mainScriptContent = readFileSync(mainScript, 'utf8');	
		let updateMsg = false;

		// add entry to main.js if it doesn't exist
		associatedScripts.forEach(script => {

			if (!mainScriptContent.includes(`import ${kebabToCamel(script)} from "./components/${script}.js";`)) {
				updateMsg = true;
				// insert import statement
				let newImportStatement = `import ${kebabToCamel(script)} from "./components/${script}.js";`;
				mainScriptContent = insertLineAfter(mainScriptContent, '// end imports', newImportStatement);
				
				// insert init statement
				newImportStatement = `	${kebabToCamel(script)}.init();`;
				mainScriptContent = insertLineAfter(mainScriptContent, '// end inits', newImportStatement);
				
				userMsg(`${kebabToCamel(script)} snippets where added to ${mainScript.replace(msPath, "")}`, true);
			}
		});

		// insert the youtube api script if section includes a video and api is not present
		if ( associatedScripts.includes('inline-video') || 
		     associatedScripts.includes('modal-video') || 
				 associatedScripts.includes('video')) {
			// Split the file content by lines
			lines = mainScriptContent.split('\n');

			// Check if the youtube api script is already present
			let youtubeScriptPresent = lines.findIndex(line => line.includes('// load youTube video JS api'));

			if (youtubeScriptPresent === -1) {
				// Find the line index after which you want to insert the new int statement
				indexOfInsertion = lines.findIndex(line => line.includes('// start inits'));

				// get the content of the file youtube-api.js
				const youtubeApiScript = `${libPath}/template-scripts/youtube-api.js`;
				const youtubeApiScriptContent = readFileSync(youtubeApiScript, 'utf8');

				// Insert the new init statement after the specified index
				lines.splice(indexOfInsertion+1, 0, `${youtubeApiScriptContent}\n\n`);
				
				userMsg(`The YouTube API was added to ${mainScript.replace(msPath, "")}.`, true);

				// Join the modified lines back into a string
				mainScriptContent = lines.join('\n') + "\n";
			}
		}

		writeFileSync(mainScript, mainScriptContent);
		
		if (updateMsg) {
			userMsg(`${mainScript.replace(msPath, "")} was updated with new scripts.`, true);
		}
	}
}

/**
 * @function handleSectionData
 * @param {*} pageParams 
 * @param {*} libPath - path to the assets of this tool
 * @param {*} msPath - path to the root of the site we are building
 * @returns void
 * @description adds sections to the page object and writes the page file
 */
async function handleSectionData(pageParams, libPath, msPath) {
	lineSpacer();
	userHint('Now let\'s move on to adding some sections to your page.');

	const { addSections } = await askToAddSections();
	lineSpacer();
	if (!addSections) {
		return [];
	} else {
		// get sections
		return await getSections(libPath, msPath);
	}
}

/**
 * Prompts and Confirmations
 */
async function askForPageName(defaults, pageParams) {
	await loadInquirer();
	return await inquirer.prompt([
		{
			name: 'pageFileName',
			type: 'input',
			message: `file name ${pageParams.pageFileName} already exists, change it by typing in a new name or Y to overwrite the existing file \n`,
			default: pageParams.pageFileName,
		},
	]);
}

async function confirmDetails() {
	await loadInquirer();
	return await inquirer.prompt([
		{
			type: 'confirm',
			name: 'proceed',
			message: 'Do you confirm these details?',
			default: true
		}
	]);
}

async function askToAddSections() {
	await loadInquirer();
	return await inquirer.prompt([
		{
			type: 'confirm',
			name: 'addSections',
			message: 'Do you want to add sections?',
			default: true
		}
	]);
}

async function selectSectionTemplate(sectionTemplates) {
	await loadInquirer();
	return await inquirer.prompt([
		{
			type: 'list',
			name: 'sectionTemplate',
			message: 'Choose a section template:',
			choices: sectionTemplates
		}
	]);
}

async function askToAddAnotherSection() {
	await loadInquirer();
	return await inquirer.prompt([
		{
			type: 'confirm',
			name: 'addAnotherSection',
			message: 'Do you want to add another section?',
			default: false
		}
	]);
}

async function askToAddAnotherPage() {
	await loadInquirer();
	return await inquirer.prompt([
		{
			type: 'confirm',
			name: 'addAnotherPage',
			message: 'Do you want to add another page?',
			default: false
		}
	]);
}

/**
 * @function createFrontmatterForPage
 * @param {*} pageObject
 * @returns string
 * @description creates the frontmatter for the page object
 */
function createFrontmatterForPage(pageObject) {
	const data = YAML.stringify(pageObject);
	return `--- \n${data}\n---`;
}

/**
 * @function displayPageParams
 * @param {*} pageParams
 * @returns void
 * @description displays the pageParams object
 */
function displayPageParams(pageParams, isBlogPage) {

	if (isBlogPage) {
		userHint('Your blog page properties:');
	}
	else {
		userHint('Your page properties:');
	}
	userHint(`- Pages Path: ${pageParams.pagesPath}`);
	userHint(`- Page Nav Label: ${pageParams.pageNavLabel}`);
	userHint(`- Page Nav Order: ${pageParams.pageNavOrder}`);
	userHint(`- Page Nav Icon: ${pageParams.pageNavIcon}`);
	userHint(`- Page File Name: ${pageParams.pageFileName}.md`);
	userHint(`- Page Template: ${pageParams.pageTemplate}`);
	userHint(`- Body Classes: ${pageParams.bodyClasses}`);
	userHint(`- Meta Title: ${pageParams.metaTitle}`);
	userHint(`- Meta Description: ${pageParams.metaDescription}`);
	userHint(`- Canonical URL: ${pageParams.canonicalOverwrite}`);

	if (isBlogPage) {
		userHint(`- Blog Title: ${pageParams.blogTitle}`);
		userHint(`- Blog Date: ${pageParams.blogDate}`);
		userHint(`- Blog Author: ${pageParams.blogAuthor}`);
		userHint(`- Blog Image Source: ${pageParams.blogImageSource}`);
		userHint(`- Blog Image Alt: ${pageParams.blogImageAlt}`);
		userHint(`- Blog Image Caption: ${pageParams.blogImageCaption}`);
		userHint(`- Blog Excerpt: ${pageParams.blogExcerpt}`);
	}
}

/**
 * @function mergePageParams
 * @param {*} pageParams
 * @returns void
 * @description merges the pageParams into the page object
 */
function mergePageParams(pageParams, isBlogPage) {
	page.layout = pageParams.pageTemplate;
	page.nav.label = pageParams.pageNavLabel;
	page.nav.order = pageParams.pageNavOrder;
	page.nav.icon = pageParams.pageNavIcon;
	page.bodyClasses = pageParams.bodyClasses;
	page.seo.title = pageParams.metaTitle;
	page.seo.description = pageParams.metaDescription;
	page.seo.canonicalOverwrite = pageParams.canonicalOverwrite;

	if (isBlogPage) {
		page.blogTitle = pageParams.blogTitle;
		page.date = pageParams.blogDate;
		page.author = pageParams.blogAuthor;
		page.image = {};
		page.image.src = pageParams.blogImageSource;
		page.image.alt = pageParams.blogImageAlt;
		page.image.caption = pageParams.blogImageCaption;
		page.excerpt = pageParams.blogExcerpt;
	}
}

/**
 * CLI Setup
 */
const program = new Command();
program
	.name('ms-start')
	.description('Metalsmith page scaffolding for structured content')
	.version('0.0.1');

program
	.command('init')
	.argument('<projectName>', 'Name of the project')
	.description('Download the Metalsmith First repository and initialize a new git repository')
	.action(init);

program
	.command('addPages')
	.description('Add one or more pages with frontmatter scaffold to site')
	.action(addPages);

program
	.command('addSectionTo pageName')
	.description('Add one or more additional sections to a page')
	.action(addSectionTo);

program
	.command('buildNav')
	.description('Build the site navigation')
	.action(buildNav);

program.parse(process.argv);
