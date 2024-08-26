import { TRIGGER_EMOJI_CHARACTERS_LEN } from './emoji'

/**
 * Inline markdown regular expressions are evaluated twice: the first pass is
 * evaluated by quill when the user hits the space bar, and it is evaluated _forwards_.
 * The second pass is evaluted within the `formatInline` function and it is evaluated
 * from the cursor _backwards_ to the terminating sigil (which in reality is the opening sigil).
 * Here is an example:
 *
 * `:crystal_ball: Hello, do you like my _cool_|`
 *
 * In the example above, the user's cursor is immediately after the closing _. Once the user
 * hits the spacebar, the keyboard module will fire and quill will notice that there is something
 * matching the italic format in this line. Then it calls `formatInline` where the string is
 * reversed starting from the cursor back to the beginning of the leaf. This is now
 * the text within the `formatInline` function:
 *
 * `_looc_ ym ekil uoy od ,olleH `
 *
 * Since we are working with the leaf instead of the line, it has stripped out the emoji which
 * makes the regex simpler. Then the regex runs the second time. For italics, it will ensure the string
 * starts with an underscore and then it will match until it finds an underscore immediately followed
 * by a space or the end of the string:
 *
 * `_looc_ `
 *
 * The underscores are non-capturing groups and the space at the end is a positive lookahead, so
 * the final text we end up with is:
 *
 * `looc`
 *
 * Which we can then reverse again and apply as an operation to the document. This is admittedly
 * very complicated, but it is necessary because formatting sigils have both semantic and non-semantic
 * meaning within a markdown document. Take again the underscore as an example:
 *
 * Italic text: `This is so _cool_`
 * Emoji shortcode word separators: `:crystal_ball:`
 * Plain usage:
 *  `...the E_ code we ran into was E_HARMONY...`
 *  `...all codes begin with an E followed by a _ and then a unique word...`
 * Complicated: `We looked into our :crystal_ball: and noticed that we were getting the _E_HARMONY_ error`
 *
 * These are all inline usages and can be combined on a single line, so it is not a reliable strategy
 * to parse from the beginning of the line until we find the beginning and then the end
 * formatting sigils. It is possible and likely to mistake semantic and non-semantic sigils.
 * Since markdown is formatted on the press of the spacebar key, it _is_
 * a reliable strategy to work from the cursor backwards to the opening sigil.
 */
export const REG_EX_PATTERNS = {
    blockquote: /^(>)/,
    bold: /(?:\*){2}(.+?)(?:\*){2}/,
    boldCode: /(?:\*\*\`|\`\*\*)(.+?)(?:\`\*\*|\*\*\`)/,
    boldItalic: /(?:\*\*\_|\_\*\*)(.+?)(?:\_\*\*|\*\*\_)/,
    boldStrikethrough: /(?:\*\*\~\~|\~\~\*\*)(.+?)(?:\~\~\*\*|\*\*\~\~)/,
    boldUnderline: /(?:\*\*\_\_|\_\_\*\*)(.+?)(?:\_\_\*\*|\*\*\_\_)/,
    code: /(?:`)(.+?)(?:`)/,
    codeBlock: /^`{3}/,
    emptyOrSpace: /\s*$/,
    emptyRowDivider: /^(_{3}|\*{3}|-{3})$/,
    emptyString: /^(?![\s\S])/,
    divider: /^(_{2}|\*{2}|-{2})$/,
    headline: /^[#]{1,3}$/,
    hrefLink: /(?:\((.*?)\))/,
    hrefText: /(?:\[(.*?)\])/,
    italic: /(?:_){1}(.+)(?:_(?=\s|$)){1}/,
    italicCode: /(?:\`\_|\_\`)(.+?)(?:\_\`|\`\_)/,
    italicStrikethrough: /(?:\_\~\~|\~\~\_)(.+?)(?:\~\~\_|\_\~\~)/,
    link: /(?:\[(.+?)\])(?:\((.+?)\))/,
    list: /^\s*?(\*|1\.|-|\[ ?\]|\[x\])$/,
    mention: /(?:^|[^a-zA-Z0-9_＠!@#$%&*])(?:(?:@|＠)(?!\/))([a-zA-Z0-9/_.]{1,15})(?:\b(?!@|＠)|$)/,
    singleDashEmptyLine: /^-$/,
    strikethrough: /(?:~~)(.+?)(?:~~)/,
    underline: /(?:\_){2}(.+?)(?:\_){2}/,
    underlineCode: /(?:\_\_\`|\`\_\_)(.+?)(?:\`\_\_|\_\_\`)/,
    underlineStrikethrough: /(?:\_\_\~\~|\~\~\_\_)(.+?)(?:\~\~\_\_|\_\_\~\~)/,
    // for when you type a closing colon (:dog:) to insert the emoji but only at the end of a line
    emojiShortname: new RegExp(
        `:[a-z0-9+-]{${TRIGGER_EMOJI_CHARACTERS_LEN - 1},}$`,
        'i'
    ),
    // for the emoji picker
    emojiShortnameMidline: new RegExp(
        `:[a-z0-9+-]{${TRIGGER_EMOJI_CHARACTERS_LEN - 1},}`,
        'i'
    ),
    emojiSpaceStart: /\s$/
}
