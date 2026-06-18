import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navConfig';
import ChildCareIcon from '@mui/icons-material/ChildCare';

const DRAWER_WIDTH = 250;

// 侧边栏导航
export function Sidebar() {
  const groups = Array.from(new Set(NAV_ITEMS.map((i) => i.group)));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 品牌 */}
      <Stack direction="row" spacing={1.3} alignItems="center" sx={{ px: 2.5, py: 2.4 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#C8553D',
            color: '#fff',
            boxShadow: '0 6px 14px rgba(200,85,61,0.4)',
          }}
        >
          <ChildCareIcon />
        </Box>
        <Box>
          <Typography sx={{ fontFamily: '"Noto Serif SC", serif', fontWeight: 700, fontSize: 18, color: '#fff', lineHeight: 1.1 }}>
            月嫂管家
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1 }}>
            MATERNITY CARE OS
          </Typography>
        </Box>
      </Stack>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* 导航分组 */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.2 }}>
        {groups.map((group) => (
          <Box key={group} sx={{ mb: 1 }}>
            <Typography sx={{ px: 2.8, py: 0.8, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>
              {group}
            </Typography>
            <List disablePadding>
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton component={NavLink} to={item.path} end>
                    <ListItemIcon>
                      <item.icon sx={{ fontSize: 21 }} />
                    </ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14.5, fontWeight: 500 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ px: 2.5, py: 1.8 }}>
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
          管理员 · 运营中心
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', mt: 0.3 }}>
          v1.0 · 温暖庇护所
        </Typography>
      </Box>
    </Box>
  );
}

export { DRAWER_WIDTH };
