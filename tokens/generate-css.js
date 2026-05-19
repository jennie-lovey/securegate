const fs = require('fs');

// Read JSON files
const colorsData = JSON.parse(fs.readFileSync('colors.json', 'utf8'));
const typographyData = JSON.parse(fs.readFileSync('design-tokens.tokens.json', 'utf8'));

let cssContent = '/* Auto-generated CSS variables from design tokens */\n\n:root {\n';

// Process Typography Tokens
// We will extract from typographyData.typography or typographyData.font
const typography = typographyData.font || typographyData.typography;
if (typography) {
  cssContent += '  /* Typography Tokens */\n';
  for (const [key, valueObj] of Object.entries(typography)) {
    const formattedKey = key.replace(/\s+/g, '-').toLowerCase();
    
    // Some formats have type/value, others directly
    const props = valueObj.value || valueObj;
    
    // We can extract common CSS properties
    if (props.fontFamily) cssContent += `  --font-${formattedKey}-family: '${props.fontFamily.value || props.fontFamily}';\n`;
    if (props.fontSize !== undefined) {
       const size = props.fontSize.value !== undefined ? props.fontSize.value : props.fontSize;
       cssContent += `  --font-${formattedKey}-size: ${size}px;\n`;
    }
    if (props.fontWeight !== undefined) {
       const weight = props.fontWeight.value !== undefined ? props.fontWeight.value : props.fontWeight;
       cssContent += `  --font-${formattedKey}-weight: ${weight};\n`;
    }
    if (props.lineHeight !== undefined) {
       const height = props.lineHeight.value !== undefined ? props.lineHeight.value : props.lineHeight;
       cssContent += `  --font-${formattedKey}-line-height: ${height}px;\n`;
    }
    if (props.letterSpacing !== undefined) {
       const spacing = props.letterSpacing.value !== undefined ? props.letterSpacing.value : props.letterSpacing;
       cssContent += `  --font-${formattedKey}-letter-spacing: ${spacing}px;\n`;
    }
  }
}

// Process Color Tokens
// Helper function to resolve references like "{color.palette.primary.100}"
function resolveColor(ref, root) {
  if (typeof ref !== 'string' || !ref.startsWith('{') || !ref.endsWith('}')) {
    return ref;
  }
  const path = ref.slice(1, -1).split('.');
  let current = root;
  for (const p of path) {
    if (current[p] !== undefined) {
      current = current[p];
    } else {
      return ref; // fallback
    }
  }
  return current;
}

const colorDataRoot = colorsData; // entire object

if (colorsData.color && colorsData.color.role) {
  cssContent += '\n  /* Color Tokens - Light Theme */\n';
  const lightRoles = colorsData.color.role.light;
  for (const [roleName, roleValue] of Object.entries(lightRoles)) {
    const resolvedColor = resolveColor(roleValue, colorDataRoot);
    const cssVarName = `--color-${roleName.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    cssContent += `  ${cssVarName}: ${resolvedColor};\n`;
  }
}

cssContent += '}\n';

// Dark Theme Colors
if (colorsData.color && colorsData.color.role && colorsData.color.role.dark) {
  cssContent += '\n@media (prefers-color-scheme: dark) {\n  :root {\n';
  cssContent += '    /* Color Tokens - Dark Theme */\n';
  const darkRoles = colorsData.color.role.dark;
  for (const [roleName, roleValue] of Object.entries(darkRoles)) {
    const resolvedColor = resolveColor(roleValue, colorDataRoot);
    const cssVarName = `--color-${roleName.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    cssContent += `    ${cssVarName}: ${resolvedColor};\n`;
  }
  cssContent += '  }\n}\n';
}

fs.writeFileSync('tokens.css', cssContent);
console.log('Successfully generated tokens.css!');
