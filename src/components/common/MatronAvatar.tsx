import { Avatar, type AvatarProps } from '@mui/material';

const PALETTE = ['#1F4E3D', '#C8553D', '#4A7A8C', '#7B5EA7', '#3E7D5B', '#D9923B', '#A8412C', '#5C7A3C'];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// 月嫂头像：取名字末两字 + 哈希配色，避免依赖外部图片
export function MatronAvatar({
  name,
  size = 44,
  ...rest
}: { name: string; size?: number } & AvatarProps) {
  return (
    <Avatar
      {...rest}
      sx={{
        bgcolor: colorFor(name),
        width: size,
        height: size,
        fontFamily: '"Noto Serif SC", serif',
        fontWeight: 700,
        fontSize: size * 0.4,
        ...(rest.sx as object),
      }}
    >
      {name ? name.slice(-2) : '?'}
    </Avatar>
  );
}
