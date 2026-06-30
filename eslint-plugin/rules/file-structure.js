const TYPE_NODES = new Set(["TSTypeAliasDeclaration", "TSInterfaceDeclaration", "TSEnumDeclaration"]);

const ORDER = {
	imports: 0,
	types: 1,
	constants: 2,
	components: 3,
	hooks: 4,
	helpers: 5,
	other: 99,
};

function isImport(node) {
	return node.type === "ImportDeclaration";
}

function isType(node) {
	return TYPE_NODES.has(node.type);
}

function isConstant(node) {
	return node.type === "VariableDeclaration" && node.kind === "const";
}

function isFunction(node) {
	return node.type === "FunctionDeclaration" || node.type === "VariableDeclaration";
}

function getName(node) {
	if (node.type === "FunctionDeclaration") return node.id?.name ?? "";

	if (node.type === "VariableDeclaration") {
		const declaration = node.declarations[0];
		return declaration?.id?.name ?? "";
	}

	return "";
}

function isReactComponent(node) {
	return /^[A-Z]/.test(getName(node));
}

function isHook(node) {
	return /^use[A-Z0-9]/.test(getName(node));
}

function isHelperFunction(node) {
	return isFunction(node) && !isReactComponent(node) && !isHook(node);
}

function getSection(node) {
	if (isImport(node)) return "imports";
	if (isType(node)) return "types";
	if (isConstant(node) && !isReactComponent(node) && !isHook(node)) return "constants";
	if (isReactComponent(node)) return "components";
	if (isHook(node)) return "hooks";
	if (isHelperFunction(node)) return "helpers";

	return "other";
}

function getNodeRangeWithLeadingComments(sourceCode, node) {
	const comments = sourceCode.getCommentsBefore(node);
	const leadingComments = comments.filter((comment) => {
		const linesBetween = node.loc.start.line - comment.loc.end.line;
		return linesBetween <= 1;
	});

	if (leadingComments.length === 0) {
		return node.range;
	}

	return [leadingComments[0].range[0], node.range[1]];
}

function findClosestValidTarget(body, node) {
	const nodeSection = getSection(node);
	const nodeOrder = ORDER[nodeSection];

	let target = null;

	for (const candidate of body) {
		if (candidate === node) break;

		const candidateSection = getSection(candidate);
		if (candidateSection === "other") continue;

		if (ORDER[candidateSection] <= nodeOrder) {
			target = candidate;
		}
	}

	return target;
}

function createMoveFix(sourceCode, node, targetNode) {
	return (fixer) => {
		const range = getNodeRangeWithLeadingComments(sourceCode, node);
		const text = sourceCode.text.slice(range[0], range[1]).trim();

		return [fixer.removeRange(range), fixer.insertTextAfter(targetNode, `\n\n${text}`)];
	};
}

function checkSectionOrder(body, context, sourceCode) {
	let highestSeenSection = -1;
	let highestSeenName = "";

	for (const node of body) {
		const section = getSection(node);
		if (section === "other") continue;

		const sectionOrder = ORDER[section];

		if (sectionOrder < highestSeenSection) {
			const targetNode = findClosestValidTarget(body, node);

			context.report({
				node,
				messageId: "wrongOrder",
				data: {
					current: section,
					previous: highestSeenName,
				},
				fix: targetNode ? createMoveFix(sourceCode, node, targetNode) : null,
			});
		}

		if (sectionOrder > highestSeenSection) {
			highestSeenSection = sectionOrder;
			highestSeenName = section;
		}
	}
}

const rule = {
	meta: {
		type: "suggestion",
		fixable: "code",
		docs: {
			description: "Enforce Yamikhal file structure order.",
		},
		schema: [],
		messages: {
			wrongOrder: "{{current}} should appear before {{previous}} according to Yamikhal file structure.",
		},
	},

	create(context) {
		const sourceCode = context.sourceCode;

		return {
			Program(program) {
				checkSectionOrder(program.body, context, sourceCode);
			},
		};
	},
};

export default rule;
