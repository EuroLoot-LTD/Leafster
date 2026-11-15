# Interface icon sources

Leafster now uses compact **filled system icons from Google Material Icons v3.0.1**, released in 2016, rather than modern rounded outline icons. These are generic licensed system symbols, not icons extracted from YouTube.

## Primary research and licence

- [Google's official Material Icons guide](https://developers.google.com/fonts/docs/material_icons) documents SVG use and Apache 2.0 licensing.
- [The version 3.0.1 README](https://github.com/google/material-design-icons/blob/3.0.1/README.md) records the licence change to Apache 2.0.
- [Pinned source commit](https://github.com/google/material-design-icons/commit/40ef0f297970f0e78bf87569f43ea90ec53d571c), dated 1 September 2016.
- [Exact upstream licence](https://github.com/google/material-design-icons/blob/40ef0f297970f0e78bf87569f43ea90ec53d571c/LICENSE).
- The full licence is included at `public/licenses/material-icons-Apache-2.0.txt` and served at `/licenses/material-icons-Apache-2.0.txt`.
- Font Awesome 4.7's [official licence page](https://fontawesome.com/v4/license/) was evaluated. Material v3.0.1's explicit Apache-licensed SVGs were selected to keep vector licensing and provenance straightforward. The earlier Material v2.2.0 licence was CC BY 4.0; its vectors were **not** used.

## Adaptation

Upstream filled path geometry is unchanged. The React wrapper, local export names, sizing, `currentColor` fill, and decorative accessibility attributes were added for Leafster. Empty transparent canvas paths were omitted. `strokeWidth` is accepted for compatibility but deliberately ignored: these symbols are solid silhouettes, not thin outline strokes. No remote fonts or runtime asset service is used.

The small Leaf and Sprout utility symbols are original angular paths authored for this interface. They do not replace or modify the official Leafster logo. Application source independence does not imply these third-party icons are original artwork; their source and licence are recorded here.

## Exact source mapping

| Leafster export   | Vintage Material source                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ArrowDown         | [arrow_downward](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_arrow_downward_24px.svg) |
| ArrowLeft         | [arrow_back](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_arrow_back_24px.svg)         |
| ArrowRight        | [arrow_forward](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_arrow_forward_24px.svg)   |
| Bell              | [notifications](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/social/svg/production/ic_notifications_24px.svg)       |
| Bookmark          | [bookmark](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_bookmark_24px.svg)                 |
| Check             | [check](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_check_24px.svg)                   |
| ChevronDown       | [expand_more](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_expand_more_24px.svg)       |
| ChevronRight      | [chevron_right](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_chevron_right_24px.svg)   |
| Clock3            | [schedule](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_schedule_24px.svg)                 |
| Compass           | [explore](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_explore_24px.svg)                   |
| Download          | [file_download](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/file/svg/production/ic_file_download_24px.svg)         |
| Ellipsis          | [more_horiz](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_more_horiz_24px.svg)         |
| Eye               | [remove_red_eye](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/image/svg/production/ic_remove_red_eye_24px.svg)      |
| Flag              | [flag](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/content/svg/production/ic_flag_24px.svg)                        |
| FolderPlus        | [create_new_folder](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/file/svg/production/ic_create_new_folder_24px.svg) |
| History           | [history](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_history_24px.svg)                   |
| Home              | [home](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_home_24px.svg)                         |
| Image             | [image](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/image/svg/production/ic_image_24px.svg)                        |
| ListVideo         | [playlist_play](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/av/svg/production/ic_playlist_play_24px.svg)           |
| Loader2           | [refresh](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_refresh_24px.svg)               |
| LogIn             | [input](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_input_24px.svg)                       |
| LogOut            | [exit_to_app](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_exit_to_app_24px.svg)           |
| Menu              | [menu](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_menu_24px.svg)                     |
| MessageCircle     | [chat_bubble](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/communication/svg/production/ic_chat_bubble_24px.svg)    |
| MonitorPlay       | [video_library](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/av/svg/production/ic_video_library_24px.svg)           |
| Play              | [play_arrow](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/av/svg/production/ic_play_arrow_24px.svg)                 |
| Plus              | [add](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/content/svg/production/ic_add_24px.svg)                          |
| Search            | [search](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_search_24px.svg)                     |
| Settings          | [settings](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_settings_24px.svg)                 |
| ShieldCheck       | [verified_user](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_verified_user_24px.svg)       |
| SlidersHorizontal | [equalizer](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/av/svg/production/ic_equalizer_24px.svg)                   |
| Sparkles          | [flare](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/image/svg/production/ic_flare_24px.svg)                        |
| ThumbsDown        | [thumb_down](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_thumb_down_24px.svg)             |
| ThumbsUp          | [thumb_up](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_thumb_up_24px.svg)                 |
| Trash2            | [delete](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_delete_24px.svg)                     |
| TrendingUp        | [trending_up](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/action/svg/production/ic_trending_up_24px.svg)           |
| Upload            | [file_upload](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/file/svg/production/ic_file_upload_24px.svg)             |
| Users             | [group](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/social/svg/production/ic_group_24px.svg)                       |
| Video             | [videocam](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/av/svg/production/ic_videocam_24px.svg)                     |
| X                 | [close](https://raw.githubusercontent.com/google/material-design-icons/40ef0f297970f0e78bf87569f43ea90ec53d571c/navigation/svg/production/ic_close_24px.svg)                   |
| Leaf, Sprout      | Original Leafster utility paths                                                                                                                                                |
