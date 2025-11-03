// src/theme/palette.js
// Material-like color palette for light and dark themes
const palette = {
  light: {
    mode: "light",
    primary: {
      main: "#6750A4",
      contrastText: "#FFFFFF",
      container: "#EADDFF",
      onContainer: "#21005D",
    },
    secondary: {
      main: "#625B71",
      contrastText: "#FFFFFF",
      container: "#E8DEF8",
      onContainer: "#1D192B",
    },
    tertiary: {
      main: "#7D5260",
      contrastText: "#FFFFFF",
      container: "#FFD8E4",
      onContainer: "#31111D",
    },
    error: {
      main: "#B3261E",
      contrastText: "#FFFFFF",
      container: "#F9DEDC",
      onContainer: "#410E0B",
    },
    background: {
      default: "#FFFBFE",
      paper: "#FFFFFF",
    },
    surface: {
      main: "#FFFBFE",
      on: "#1C1B1F",
      variant: "#E7E0EC",
      onVariant: "#49454F",
    },
    outline: "#79747E",
    shadow: "#000000",
    text: {
      primary: "#1C1B1F",
      secondary: "#49454F",
      disabled: "#79747E",
    },
  },

  dark: {
    mode: "dark",
    primary: {
      main: "#D0BCFF",
      contrastText: "#371E73",
      container: "#4F378B",
      onContainer: "#EADDFF",
    },
    secondary: {
      main: "#CCC2DC",
      contrastText: "#332D41",
      container: "#4A4458",
      onContainer: "#E8DEF8",
    },
    tertiary: {
      main: "#EFB8C8",
      contrastText: "#492532",
      container: "#633B48",
      onContainer: "#FFD8E4",
    },
    error: {
      main: "#F2B8B5",
      contrastText: "#601410",
      container: "#8C1D18",
      onContainer: "#F9DEDC",
    },
    background: {
      default: "#1C1B1F",
      paper: "#1C1B1F",
    },
    surface: {
      main: "#1C1B1F",
      on: "#E6E1E5",
      variant: "#49454F",
      onVariant: "#CAC4D0",
    },
    outline: "#938F99",
    shadow: "#000000",
    text: {
      primary: "#E6E1E5",
      secondary: "#CAC4D0",
      disabled: "#938F99",
    },
  },
};

export default palette;
