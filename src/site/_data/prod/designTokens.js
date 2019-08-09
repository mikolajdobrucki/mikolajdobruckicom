const axios  = require('axios');
const seed   = require('../../../utils/save-seed.js');

var url = `https://api.figma.com/v1/files/` + process.env.FIGMA_FILEID;

module.exports = () => {
  return new Promise((resolve, reject) => {
    axios.get(url, {
      headers: {
          "X-Figma-Token": process.env.FIGMA_APIKEY
      }
    })
      .then(response => {

        // find Figma document page containing styleguide        
        const stylesPage = response.data.document.children.filter(item => {
          return item.name === "styleguide";
        })[0].children;
        
        // Find Figma frame with typography styles
        const typographyFrame = stylesPage.filter(item => {
          return item.name === "typography";
        })[0].children;

        // Specify default font size
        const defaultFontSize = typographyFrame.filter(item => {
          return item.name === "default";
        })[0].style.fontSize;

        // Round a token to two decimal places
        function toTwoDecimals (num) {
          return Math.round(num * 100) / 100;
        }

        // Typography tokens
        function getTypography() {

          // Object for all typography tokens
          const typographyStyles = {};
          
          // Map layers into single styles and merge them into typographyStyles object
          typographyFrame.map(typographyItem => {
            let typographyStyle = {
              [typographyItem.name]: {
                family: `${typographyItem.style.fontFamily}`,
                size: `${typographyItem.style.fontSize / defaultFontSize}`,
                weight: `${typographyItem.style.fontWeight}`,
                lineHeight: `${typographyItem.style.lineHeightPercent}`,
                letterSpacing: `${typographyItem.style.letterSpacing}`
              }
            }

            Object.assign(typographyStyles, typographyStyle);
          })

          return typographyStyles;
        }

        // Color tokens
        function getColors() {

          // Object for all color tokens
          const colorStyles = {};

          // Find Figma frame with color styles
          const colorsFrame = stylesPage.filter(item => {
            return item.name === "colors";
          })[0].children;

          // RGBA color converter for Figma values
          function toRGBA(figmaColor) {

            function channelTransform(channel) {
              return Math.round(channel * 255);
            }

            if (figmaColor.color.a === 1) {
              return `rgb(${channelTransform(figmaColor.color.r)}, ${channelTransform(figmaColor.color.g)}, ${channelTransform(figmaColor.color.b)})`;
            } else {
              return `rgba(${channelTransform(figmaColor.color.r)}, ${channelTransform(figmaColor.color.g)}, ${channelTransform(figmaColor.color.b)}, ${figmaColor.color.a})`;
            }
          }
          
          // Map layers into single styles and merge them into colorStyles object
          colorsFrame.map(colorItem => {
            if (colorItem.type === 'RECTANGLE') { // Ignore groups and other supporting layers such as backgrounds and text
              let colorStyle = {
                [colorItem.name]: toRGBA(colorItem.fills[0])
              }
  
              Object.assign(colorStyles, colorStyle);
            }
          })

          return colorStyles;
        }

        // Spacing tokens
        function getSpacers() {

          // Object for all color tokens
          const spacers = {};

          // Find Figma frame with color styles
          const spacersFrame = stylesPage.filter(item => {
            return item.name === "spacers";
          })[0].children;

          // Spacing tokens
          spacersFrame.map(spacerItem => {
            let spacer = {
              [spacerItem.name]: `${toTwoDecimals(spacerItem.absoluteBoundingBox.height / defaultFontSize)}`
            }

            Object.assign(spacers, spacer)
          })

          return spacers;
        }

        // All design tokens together
        tokensJSON = {
          typography: getTypography(),
          color: getColors(),
          spacing: getSpacers()
        };

        seed(JSON.stringify(tokensJSON), `${__dirname}/../dev/designTokens.json`)
        resolve(tokensJSON);
      })
      .catch(err => {
        reject(err);
      });
  })
}
