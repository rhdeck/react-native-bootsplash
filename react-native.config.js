const { generate, addToProject } = require("./lib/generate");
const { spawnSync } = require("child_process");
const { join } = require("path");
const { existsSync, mkdirSync } = require("fs");
module.exports = {
  commands: [
    {
      name: "add-bootsplash-to-xcode",
      description: "Add bootsplash launch screen to xcode",
      func: () => {
        addToProject();
      },
    },
    {
      name: "generate-bootsplash [iconPath]",
      description: "Initialize bootsplash with arguments or interactively",
      options: [
        {
          name: "--iconPath [path]",
          description:
            "Path to icon to build the bootsplash screen around in universal/light/day mode interfaces (leave blank for interactive)",
          default: "",
        },
        {
          name: "--backgroundColor [color]",
          description: "Background color to wrap around the icon",
          default: "",
        },
        {
          name: "--iconWidth <width>",
          default: 100,
          parse: arg => parseInt(arg),
          description: "Width of the icon in background image",
        },
        {
          name: "--darkIconPath [path]",
          description:
            "Path to icon Path to icon  to build bootsplash screen around in dark/night mode interfaces",
          default: "",
        },
        {
          name: "--darkBackgroundColor [color]",
          description:
            "Background color to wrap around the icon in dark/night mode",
          default: "",
        },
        {
          name: "--addToXcode",
          description:
            "Add the storyboard file to Xcode and make it default launch screen",
        },
      ],
      func: async (
        [possibleIconPath],
        __,
        {
          iconPath,
          backgroundColor,
          iconWidth,
          addToXcode,
          darkIconPath,
          darkBackgroundColor,
        },
      ) => {
        if (possibleIconPath && !iconPath) iconPath = possibleIconPath;
        if (!iconPath) {
          spawnSync("node", [join(__dirname, "scripts", "generate.js")], {
            stdio: "inherit",
          });
        } else {
          const out = await generate({
            projectPath: ".",
            assetsPath,
            iconPath,
            backgroundColor,
            iconWidth: iconWidth,
            confirmation: true,
            darkBackgroundColor,
            darkIconPath,
          });
          if (addToXcode) addToProject();
        }
      },
    },
  ],
};
