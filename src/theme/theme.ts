import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// 温暖庇护所配色：深森绿为主、暖陶土为辅、象牙白底
const forest = '#1F4E3D';
const forestDark = '#163A2C';
const forestLight = '#2E6B54';
const terracotta = '#C8553D';
const terracottaDark = '#A8412C';
const ivory = '#FAF7F2';
const cream = '#F2EDE4';
const ink = '#1A2B25';
const warmGray = '#6B6258';
const warmGrayLight = '#A89F94';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: forest,
      dark: forestDark,
      light: forestLight,
      contrastText: '#FAF7F2',
    },
    secondary: {
      main: terracotta,
      dark: terracottaDark,
      light: '#D97A66',
      contrastText: '#FFFFFF',
    },
    background: {
      default: ivory,
      paper: '#FFFFFF',
    },
    text: {
      primary: ink,
      secondary: warmGray,
    },
    divider: '#E4DDD2',
    success: { main: '#3E7D5B', light: '#5FA079' },
    warning: { main: '#D9923B', light: '#E8B06A' },
    error: { main: '#B5413A', light: '#D06A63' },
    info: { main: '#4A7A8C', light: '#6E9BAE' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    h1: { fontFamily: '"Noto Serif SC", "Songti SC", serif', fontWeight: 700, fontSize: '2.4rem' },
    h2: { fontFamily: '"Noto Serif SC", "Songti SC", serif', fontWeight: 700, fontSize: '1.9rem' },
    h3: { fontFamily: '"Noto Serif SC", "Songti SC", serif', fontWeight: 600, fontSize: '1.5rem' },
    h4: { fontFamily: '"Noto Serif SC", "Songti SC", serif', fontWeight: 600, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.1rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    subtitle1: { fontWeight: 600, color: ink },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0.2 },
    body2: { color: warmGray },
    caption: { color: warmGrayLight },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: ivory,
          backgroundImage:
            'radial-gradient(circle at 12% 8%, rgba(31,78,61,0.05), transparent 42%), radial-gradient(circle at 88% 0%, rgba(200,85,61,0.05), transparent 38%)',
          backgroundAttachment: 'fixed',
        },
        '*::-webkit-scrollbar': { width: 9, height: 9 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': { background: '#D8D0C2', borderRadius: 8 },
        '*::-webkit-scrollbar-thumb:hover': { background: '#BFB6A6' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 9, paddingInline: 18, paddingBlock: 9 },
        containedPrimary: {
          boxShadow: '0 4px 12px rgba(31,78,61,0.22)',
          '&:hover': { boxShadow: '0 6px 16px rgba(31,78,61,0.3)', backgroundColor: forestDark },
        },
        containedSecondary: {
          boxShadow: '0 4px 12px rgba(200,85,61,0.22)',
          '&:hover': { boxShadow: '0 6px 16px rgba(200,85,61,0.3)', backgroundColor: terracottaDark },
        },
        outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #EAE3D7',
          backgroundImage: 'none',
          boxShadow: '0 2px 8px rgba(26,43,37,0.04)',
          borderRadius: 14,
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, borderRadius: 7 },
        outlined: { borderWidth: 1.2 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(250,247,242,0.85)',
          backdropFilter: 'blur(10px)',
          color: ink,
          boxShadow: 'none',
          borderBottom: '1px solid #EAE3D7',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: forest,
          color: '#E8E3D8',
          borderRight: 'none',
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.12) 100%)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          margin: '2px 10px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.16)' },
          },
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
        },
      },
    },
    MuiListItemIcon: { styleOverrides: { root: { color: 'inherit', minWidth: 38 } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#EFE9DD' },
        head: { fontWeight: 700, color: ink, backgroundColor: cream },
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: '#DDD4C5' },
        root: { '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#BFB6A6' } },
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: forest, fontSize: 12 } } },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 99, backgroundColor: '#E9E2D4' } },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
