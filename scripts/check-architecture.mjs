import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageName = process.argv[2];
if (!['backend', 'frontend'].includes(packageName)) {
    throw new Error('Usage: node scripts/check-architecture.mjs backend|frontend');
}
const require = createRequire(join(repository, packageName, 'package.json'));
const ts = require('typescript');
const sourceRoot = join(repository, packageName, 'src');

function sourceFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(path) ? [path] : [];
    });
}

function importsFrom(file) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const imports = [];
    function visit(node) {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
            imports.push(node.moduleSpecifier.text);
        } else if (ts.isCallExpression(node) &&
            (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === 'require') &&
            ts.isStringLiteral(node.arguments[0])) {
            imports.push(node.arguments[0].text);
        } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
            imports.push(node.argument.literal.text);
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
    return imports;
}

function resolveSource(file, specifier) {
    if (!specifier.startsWith('.')) return null;
    const base = resolve(dirname(file), specifier);
    return [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]
        .find(candidate => /\.tsx?$/.test(candidate) && existsSync(candidate)) ?? null;
}

function backendViolation(source, target) {
    const sourceLayer = source.match(/^(auth|inventory|shared)\/(domain|application)\//);
    if (!sourceLayer) return null;
    const [, feature, layer] = sourceLayer;
    if (!target) return 'Core code must use platform-independent local modules; external libraries belong in adapters.';
    const allowedLayers = layer === 'domain' ? 'domain' : '(domain|application)';
    if (!new RegExp(`^(${feature}|shared)/${allowedLayers}/`).test(target)) {
        return `${feature}/${layer} may depend only on its own core or shared core.`;
    }
    return null;
}

const componentLevels = { atoms: 0, molecules: 1, organisms: 2, templates: 3 };
function frontendViolation(source, target) {
    if (!target) return null;
    if (source.startsWith('features/') && target.startsWith('pages/')) {
        return 'Features cannot depend on page composition.';
    }
    const sourceLevel = source.match(/^components\/(atoms|molecules|organisms|templates)\//)?.[1];
    if (!sourceLevel) return null;
    if (target.startsWith('features/') || target.startsWith('pages/') || target === 'App.tsx') {
        return 'Shared UI must receive props; feature/API dependencies belong outside components.';
    }
    const targetLevel = target.match(/^components\/(atoms|molecules|organisms|templates)\//)?.[1];
    if (targetLevel && componentLevels[targetLevel] > componentLevels[sourceLevel]) {
        return `${sourceLevel} cannot import the larger ${targetLevel} composition.`;
    }
    return null;
}

const violations = [];
for (const file of sourceFiles(sourceRoot)) {
    const source = relative(sourceRoot, file).replaceAll('\\', '/');
    for (const specifier of importsFrom(file)) {
        const resolved = resolveSource(file, specifier);
        const target = resolved ? relative(sourceRoot, resolved).replaceAll('\\', '/') : null;
        const violation = packageName === 'backend' ? backendViolation(source, target) : frontendViolation(source, target);
        if (violation) violations.push(`${source} → ${specifier}: ${violation}`);
    }
}
if (violations.length) {
    console.error(violations.join('\n'));
    process.exitCode = 1;
} else {
    console.log(`${packageName}: architecture dependency rules passed.`);
}
