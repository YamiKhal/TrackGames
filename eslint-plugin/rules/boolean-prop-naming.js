const ALLOWED_PREFIXES = ["is", "has", "can", "should"];

const ALLOWED_EXCEPTIONS = new Set([
	"disabled",
	"required",
	"checked",
	"selected",
	"hidden",
	"open",
	"loading",
	"pending",
	"readonly",
	"readOnly",
	"preload",
	"priority",
	"rounded",
]);

function isBooleanKeyword(typeNode) {
	return typeNode?.type === "TSBooleanKeyword";
}

function isReadonlyType(typeNode) {
	return typeNode?.type === "TSTypeReference" && typeNode.typeName?.type === "Identifier" && typeNode.typeName.name === "Readonly";
}

function getReadonlyInnerType(typeNode) {
	if (!isReadonlyType(typeNode)) return null;

	const params = typeNode.typeArguments?.params ?? typeNode.typeParameters?.params ?? [];
	return params[0] ?? null;
}

function getPropName(member) {
	if (member.key?.type === "Identifier") return member.key.name;
	if (member.key?.type === "Literal") return String(member.key.value);
	return "";
}

function isValidBooleanPropName(name) {
	if (ALLOWED_EXCEPTIONS.has(name)) return true;

	return ALLOWED_PREFIXES.some((prefix) => {
		const rest = name.slice(prefix.length);
		return name.startsWith(prefix) && /^[A-Z]/.test(rest);
	});
}

function isPropsTypeName(name) {
	return name === "Props" || name.endsWith("Props");
}

function getTypeLiteral(typeNode) {
	const innerType = getReadonlyInnerType(typeNode) ?? typeNode;

	return innerType?.type === "TSTypeLiteral" ? innerType : null;
}

function checkTypeLiteral(context, typeLiteral) {
	for (const member of typeLiteral.members) {
		if (member.type !== "TSPropertySignature") continue;
		if (!isBooleanKeyword(member.typeAnnotation?.typeAnnotation)) continue;

		const name = getPropName(member);
		if (!name || isValidBooleanPropName(name)) continue;

		context.report({
			node: member.key,
			messageId: "badBooleanPropName",
			data: { name },
		});
	}
}

const rules = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require boolean React props to use is/has/can/should naming.",
		},
		schema: [],
		messages: {
			badBooleanPropName: "Boolean prop '{{name}}' should start with is, has, can, or should.",
		},
	},

	create(context) {
		return {
			TSTypeAliasDeclaration(node) {
				if (!isPropsTypeName(node.id.name)) return;

				const typeLiteral = getTypeLiteral(node.typeAnnotation);
				if (!typeLiteral) return;

				checkTypeLiteral(context, typeLiteral);
			},
		};
	},
};

export default rules;
