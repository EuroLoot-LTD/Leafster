/**
 * Classic filled system icons: Google Material Icons v3.0.1 (September 2016).
 * Copyright Google, Apache-2.0. Source paths are unmodified; wrappers and aliases
 * added for Leafster. Full licence: /licenses/material-icons-Apache-2.0.txt.
 * Leaf and Sprout are original Leafster interface illustrations.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number | string;
};
function classicIcon(paths: readonly string[], name: string) {
  return function ClassicIcon({
    size = 20,
    strokeWidth: _strokeWidth,
    fill: _fill,
    className = "",
    ...props
  }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        focusable="false"
        aria-hidden={props["aria-label"] ? undefined : true}
        data-icon={name}
        {...props}
        className={`classic-icon ${className}`.trim()}
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  };
}

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_arrow_downward_24px.svg
export const ArrowDown = classicIcon(
  ["M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"],
  "ArrowDown",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_arrow_back_24px.svg
export const ArrowLeft = classicIcon(
  ["M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"],
  "ArrowLeft",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_arrow_forward_24px.svg
export const ArrowRight = classicIcon(
  ["M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"],
  "ArrowRight",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/social/svg/production/ic_notifications_24px.svg
export const Bell = classicIcon(
  [
    "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  ],
  "Bell",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_bookmark_24px.svg
export const Bookmark = classicIcon(
  ["M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"],
  "Bookmark",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_check_24px.svg
export const Check = classicIcon(
  ["M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"],
  "Check",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_expand_more_24px.svg
export const ChevronDown = classicIcon(
  ["M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"],
  "ChevronDown",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_chevron_right_24px.svg
export const ChevronRight = classicIcon(
  ["M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"],
  "ChevronRight",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_schedule_24px.svg
export const Clock3 = classicIcon(
  [
    "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  ],
  "Clock3",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_explore_24px.svg
export const Compass = classicIcon(
  [
    "M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z",
  ],
  "Compass",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/file/svg/production/ic_file_download_24px.svg
export const Download = classicIcon(
  ["M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"],
  "Download",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_more_horiz_24px.svg
export const Ellipsis = classicIcon(
  [
    "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  ],
  "Ellipsis",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/image/svg/production/ic_remove_red_eye_24px.svg
export const Eye = classicIcon(
  [
    "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  ],
  "Eye",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/content/svg/production/ic_flag_24px.svg
export const Flag = classicIcon(
  ["M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"],
  "Flag",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/file/svg/production/ic_create_new_folder_24px.svg
export const FolderPlus = classicIcon(
  [
    "M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z",
  ],
  "FolderPlus",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_history_24px.svg
export const History = classicIcon(
  [
    "M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
  ],
  "History",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_home_24px.svg
export const Home = classicIcon(
  ["M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"],
  "Home",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/image/svg/production/ic_image_24px.svg
export const Image = classicIcon(
  [
    "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  ],
  "Image",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/av/svg/production/ic_playlist_play_24px.svg
export const ListVideo = classicIcon(
  ["M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h13v-2H2v2zm15-2v6l5-3-5-3z"],
  "ListVideo",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_refresh_24px.svg
export const Loader2 = classicIcon(
  [
    "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
  ],
  "Loader2",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_input_24px.svg
export const LogIn = classicIcon(
  [
    "M21 3.01H3c-1.1 0-2 .9-2 2V9h2V4.99h18v14.03H3V15H1v4.01c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98v-14c0-1.11-.9-2-2-2zM11 16l4-4-4-4v3H1v2h10v3z",
  ],
  "LogIn",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_exit_to_app_24px.svg
export const LogOut = classicIcon(
  [
    "M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",
  ],
  "LogOut",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_menu_24px.svg
export const Menu = classicIcon(
  ["M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"],
  "Menu",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/communication/svg/production/ic_chat_bubble_24px.svg
export const MessageCircle = classicIcon(
  ["M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"],
  "MessageCircle",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/av/svg/production/ic_video_library_24px.svg
export const MonitorPlay = classicIcon(
  [
    "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z",
  ],
  "MonitorPlay",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/av/svg/production/ic_play_arrow_24px.svg
export const Play = classicIcon(["M8 5v14l11-7z"], "Play");

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/content/svg/production/ic_add_24px.svg
export const Plus = classicIcon(
  ["M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"],
  "Plus",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_search_24px.svg
export const Search = classicIcon(
  [
    "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  ],
  "Search",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_settings_24px.svg
export const Settings = classicIcon(
  [
    "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z",
  ],
  "Settings",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_verified_user_24px.svg
export const ShieldCheck = classicIcon(
  [
    "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",
  ],
  "ShieldCheck",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/av/svg/production/ic_equalizer_24px.svg
export const SlidersHorizontal = classicIcon(
  ["M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"],
  "SlidersHorizontal",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/image/svg/production/ic_flare_24px.svg
export const Sparkles = classicIcon(
  [
    "M7 11H1v2h6v-2zm2.17-3.24L7.05 5.64 5.64 7.05l2.12 2.12 1.41-1.41zM13 1h-2v6h2V1zm5.36 6.05l-1.41-1.41-2.12 2.12 1.41 1.41 2.12-2.12zM17 11v2h6v-2h-6zm-5-2c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm2.83 7.24l2.12 2.12 1.41-1.41-2.12-2.12-1.41 1.41zm-9.19.71l1.41 1.41 2.12-2.12-1.41-1.41-2.12 2.12zM11 23h2v-6h-2v6z",
  ],
  "Sparkles",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_thumb_down_24px.svg
export const ThumbsDown = classicIcon(
  [
    "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z",
  ],
  "ThumbsDown",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_thumb_up_24px.svg
export const ThumbsUp = classicIcon(
  [
    "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z",
  ],
  "ThumbsUp",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_delete_24px.svg
export const Trash2 = classicIcon(
  [
    "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  ],
  "Trash2",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_trending_up_24px.svg
export const TrendingUp = classicIcon(
  ["M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"],
  "TrendingUp",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/file/svg/production/ic_file_upload_24px.svg
export const Upload = classicIcon(
  ["M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"],
  "Upload",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/social/svg/production/ic_group_24px.svg
export const Users = classicIcon(
  [
    "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  ],
  "Users",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/av/svg/production/ic_videocam_24px.svg
export const Video = classicIcon(
  [
    "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
  ],
  "Video",
);

// https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_close_24px.svg
export const X = classicIcon(
  [
    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  ],
  "X",
);

// Original Leafster utility leaf: angular silhouette with an inset vein.
export const Leaf = classicIcon(
  [
    "M20 3h-8C7 3 3 7 3 12c0 2 1 4 2 5l-3 4 2 1 3-4c2 1 4 1 6 0 5-2 7-8 7-15ZM6 13l10-7-7 10-3-3Z",
  ],
  "Leaf",
);
// Original Leafster sprout: flat stem and two geometric leaves.
export const Sprout = classicIcon(
  ["M11 21V12H8L3 7V3h5l5 5v4h1V8l4-4h4v4l-5 5h-4v8h-2Z"],
  "Sprout",
);
