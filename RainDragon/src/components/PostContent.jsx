import { generateHTML } from "@tiptap/html";

import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";

function PostContent({ content }) {
    if (!content) {
        return null;
    }

    try {
        const html = generateHTML(content, [
            StarterKit,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Image,
        ]);

        return (
            <div
                className="post-content"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    } catch (err) {
        console.error("Помилка рендерингу контенту:", err);
        return null;
    }
}

export default PostContent;