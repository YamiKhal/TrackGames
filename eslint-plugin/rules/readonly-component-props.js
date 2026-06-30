function getFunctionName(node) {
	if (node.type === "FunctionDeclaration") return node.id?.name ?? "";

	if (node.type === "VariableDeclaration") {
		return node.declarations[0]?.id?.name ?? "";
	}

	return "";
}

function isComponentName(name) {
	return /^[A-Z]/.test(name);
}

function getFunctionExpression(node) {
	if (node.type === "FunctionDeclaration") return node;

	if (node.type !== "VariableDeclaration") return null;

	const init = node.declarations[0]?.init;

	if (init?.type === "ArrowFunctionExpression") return init;
	if (init?.type === "FunctionExpression") return init;

	return null;
}

function getFirstParam(node) {
	return getFunctionExpression(node)?.params[0] ?? null;
}

function getParamAnnotationNode(param) {
	if (!param) return null;

	if (param.type === "AssignmentPattern") {
		return param.left.typeAnnotation ?? null;
	}

	return param.typeAnnotation ?? null;
}

function getParamType(param) {
	return getParamAnnotationNode(param)?.typeAnnotation ?? null;
}

function isReadonlyType(typeNode) {
	return typeNode?.type === "TSTypeReference" && typeNode.typeName?.type === "Identifier" && typeNode.typeName.name === "Readonly";
}

function getReadonlyInnerType(typeNode) {
	if (!isReadonlyType(typeNode)) return null;

	const params = typeNode.typeArguments?.params ?? typeNode.typeParameters?.params ?? [];
	return params[0] ?? null;
}

function isTypeReference(typeNode) {
	return typeNode?.type === "TSTypeReference" && typeNode.typeName?.type === "Identifier";
}

function getReferencedTypeName(typeNode) {
	return isTypeReference(typeNode) ? typeNode.typeName.name : "";
}

function isComponentDeclaration(node) {
	return isComponentName(getFunctionName(node)) && Boolean(getFunctionExpression(node));
}

function collectTypeAliases(body) {
	const aliases = new Map();

	for (const node of body) {
		if (node.type === "TSTypeAliasDeclaration") {
			aliases.set(node.id.name, node);
		}
	}

	return aliases;
}

function collectInterfaces(body) {
	const interfaces = new Map();

	for (const node of body) {
		if (node.type === "TSInterfaceDeclaration") {
			interfaces.set(node.id.name, node);
		}
	}

	return interfaces;
}

function buildReadonlyPropsText(sourceCode, typeNode) {
	const innerType = getReadonlyInnerType(typeNode) ?? typeNode;
	const text = sourceCode.getText(innerType);

	return `Readonly<${text}>`;
}

function getProgramEndInsertFix(sourceCode, fixer, text) {
	const program = sourceCode.ast;
	return fixer.insertTextBeforeRange([program.range[1], program.range[1]], `\n\n${text}\n`);
}

function replaceParamTypeFix(fixer, param, propsName) {
	const annotation = getParamAnnotationNode(param);

	if (!annotation) return null;

	return fixer.replaceText(annotation.typeAnnotation, propsName);
}

function createExtractInlinePropsFix(sourceCode, node, param, typeNode) {
	return (fixer) => {
		const componentName = getFunctionName(node);
		const propsName = `${componentName}Props`;
		const propsText = `type ${propsName} = ${buildReadonlyPropsText(sourceCode, typeNode)};`;

		return [replaceParamTypeFix(fixer, param, propsName), getProgramEndInsertFix(sourceCode, fixer, propsText)].filter(Boolean);
	};
}

function canConvertInterface(interfaceNode) {
	return !interfaceNode.extends?.length && !interfaceNode.typeParameters;
}

function createInterfaceToReadonlyTypeFix(sourceCode, interfaceNode) {
	return (fixer) => {
		if (!canConvertInterface(interfaceNode)) return null;

		const name = interfaceNode.id.name;
		const body = sourceCode.getText(interfaceNode.body);

		return fixer.replaceText(interfaceNode, `type ${name} = Readonly<${body}>;`);
	};
}

function reportInlineProps(context, sourceCode, node, param, typeNode) {
	context.report({
		node: typeNode,
		messageId: "inlineProps",
		data: {
			name: getFunctionName(node),
		},
		fix: createExtractInlinePropsFix(sourceCode, node, param, typeNode),
	});
}

function rehasPortaliasProps(context, sourceCode, alias) {
	context.report({
		node: alias,
		messageId: "typeAliasNotReadonly",
		data: {
			name: alias.id.name,
		},
		fix(fixer) {
			const text = sourceCode.getText(alias.typeAnnotation);
			return fixer.replaceText(alias.typeAnnotation, `Readonly<${text}>`);
		},
	});
}

function reportInterfaceProps(context, sourceCode, interfaceNode) {
	context.report({
		node: interfaceNode,
		messageId: "interfaceProps",
		data: {
			name: interfaceNode.id.name,
		},
		fix: canConvertInterface(interfaceNode) ? createInterfaceToReadonlyTypeFix(sourceCode, interfaceNode) : null,
	});
}

function handleInlineType(context, sourceCode, node, param, typeNode) {
	if (typeNode.type === "TSTypeLiteral") {
		reportInlineProps(context, sourceCode, node, param, typeNode);
		return true;
	}

	const innerType = getReadonlyInnerType(typeNode);

	if (innerType?.type === "TSTypeLiteral") {
		reportInlineProps(context, sourceCode, node, param, typeNode);
		return true;
	}

	return false;
}

function handleReferencedType(context, sourceCode, typeNode, typeAliases, interfaces) {
	const referencedName = getReferencedTypeName(typeNode);
	if (!referencedName) return;

	const alias = typeAliases.get(referencedName);
	if (alias && !isReadonlyType(alias.typeAnnotation)) {
		rehasPortaliasProps(context, sourceCode, alias);
		return;
	}

	const interfaceNode = interfaces.get(referencedName);
	if (interfaceNode) {
		reportInterfaceProps(context, sourceCode, interfaceNode);
	}
}

function reportComponentProps(context, sourceCode, node, typeAliases, interfaces) {
	const param = getFirstParam(node);
	const typeNode = getParamType(param);

	if (!typeNode) return;

	if (handleInlineType(context, sourceCode, node, param, typeNode)) return;

	if (isReadonlyType(typeNode)) return;

	handleReferencedType(context, sourceCode, typeNode, typeAliases, interfaces);
}

const rule = {
	meta: {
		type: "suggestion",
		fixable: "code",
		docs: {
			description: "Require React component props to use extracted Readonly props types.",
		},
		schema: [],
		messages: {
			inlineProps: "Inline component props should be extracted to a Readonly {{name}}Props type.",
			typeAliasNotReadonly: "Component props type '{{name}}' should be wrapped in Readonly<>.",
			interfaceProps: "Component props interface '{{name}}' should be converted to a Readonly type alias.",
		},
	},

	create(context) {
		const sourceCode = context.sourceCode;

		return {
			Program(program) {
				const typeAliases = collectTypeAliases(program.body);
				const interfaces = collectInterfaces(program.body);

				for (const node of program.body) {
					if (!isComponentDeclaration(node)) continue;

					reportComponentProps(context, sourceCode, node, typeAliases, interfaces);
				}
			},
		};
	},
};

export default rule;
