-- USER
CREATE TABLE "user" (
    id INT PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL,
    about VARCHAR(200),
    login VARCHAR(50) NOT NULL,
    password VARCHAR(15) NOT NULL,
    admin BOOLEAN,
    avatar TEXT
);

-- NOVEL
CREATE TABLE novel (
    id INT PRIMARY KEY,
    original_name VARCHAR(100) NOT NULL,
    ukrainian_name VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    status TEXT NOT NULL,
    volumes INT NOT NULL,
    chapters INT NOT NULL,
    extras INT NOT NULL,
    description TEXT NOT NULL,
    preview TEXT NOT NULL,
    text TEXT
);

-- WRITER
CREATE TABLE writer (
    id INT PRIMARY KEY,
    full_name VARCHAR(50) NOT NULL,
    birthday DATE NOT NULL
);

-- GENRE
CREATE TABLE genre (
    id INT PRIMARY KEY,
    genre TEXT NOT NULL
);

--------- MIDDLE TABLE
-- WRITER_LIST (writer + novel)
-- TABLE writer_list (novel <-> writer)
CREATE TABLE writer_list (
    novel_id INT NOT NULL,
    writer_id INT NOT NULL,

    PRIMARY KEY (novel_id, writer_id),

    CONSTRAINT fk_writer_list_novel FOREIGN KEY (novel_id)
        REFERENCES novel(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_writer_list_writer FOREIGN KEY (writer_id)
        REFERENCES writer(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABLE genre_list (novel <-> genre)
CREATE TABLE genre_list (
    novel_id INT NOT NULL,
    genre_id INT NOT NULL,

    PRIMARY KEY (novel_id, genre_id),

    CONSTRAINT fk_genre_list_novel FOREIGN KEY (novel_id)
        REFERENCES novel(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_genre_list_genre FOREIGN KEY (genre_id)
        REFERENCES genre(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABLE watch_list (user <-> novel)
CREATE TABLE watch_list (
    user_id INT NOT NULL,
    novel_id INT NOT NULL,
    status TEXT NOT NULL,

    PRIMARY KEY (user_id, novel_id),

    CONSTRAINT fk_watch_list_user FOREIGN KEY (user_id)
        REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_watch_list_novel FOREIGN KEY (novel_id)
        REFERENCES novel(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABLE comment
CREATE TABLE comment (
    id INT PRIMARY KEY,
    parent_id INT,
    author_id INT NOT NULL,
    novel_id INT NOT NULL,
    rate INT,
    text TEXT NOT NULL,

    CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id)
        REFERENCES comment(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_comment_author FOREIGN KEY (author_id)
        REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_comment_novel FOREIGN KEY (novel_id)
        REFERENCES novel(id) ON UPDATE CASCADE ON DELETE CASCADE
);