
const VIDEO_INFO_KEY_LIST = new Set([ 'title', 'author_name' ]);
const ENGLISH_TYPE_LIST = [ 'author', 'narrator', 'type' ];
const CC = [ 'I', 'A', 'D', 'V' ];
const OF = [ 'F', 'S', 'T' ];
const FF = { 'author'   : [ 'book',   'B', [ 'T', 'N' ], [ 'type',   'narrator' ] ],
             'narrator' : [ 'book',   'B', [ 'T', 'A' ], [ 'type',   'author'   ] ],
             'type'     : [ 'book',   'B', [ 'A', 'N' ], [ 'author', 'narrator' ] ],
             'book'     : [ 'author', 'A', [ 'T', 'N' ], [ 'type',   'narrator' ] ]
           };
const AUDIO_BOOK_ICON_DICT = { 'book'     : 'solid-book',
                               'author'   : 'person-fill',
                               'narrator' : 'reading',
                               'type'     : 'tag'
                             };

const SEARCH_MAP_DICT = { 'c' : 's', 'p' : 'b' };


function sleep(seconds){
    var waitUntil = new Date().getTime() + seconds*1000;
    while(new Date().getTime() < waitUntil) true;
}

function capitalize_word(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function get_bs_modal(id) {
    return new bootstrap.Modal(document.getElementById(id));
}

function plain_get_html_text(id) {
    return document.getElementById(id).innerHTML;
}

function plain_set_html_text(id, text) {
    document.getElementById(id).innerHTML = text;
}

function plain_get_attr(id, key) {
    var element = document.getElementById(id);
    return element.getAttribute(key);
}

function plain_set_attr(id, key, value) {
    var element = document.getElementById(id);
    element.setAttribute(key, value);
}

function plain_get_background_color(id) {
    var element = document.getElementById(id);
    return element.style.backgroundColor;
}

function plain_set_background_color(id, value) {
    var element = document.getElementById(id);
    element.style.backgroundColor = value;
}

function plain_get_query_selector(phrase) {
    return document.querySelectorAll(phrase);
}

function call_modal_dialog(title) {
    plain_set_html_text('DIALOG_TITLE', title);
    get_bs_modal('DIALOG_BOX').show();
}

function show_modal_dialog(title, body) {
    plain_set_html_text('DIALOG_BODY', body);
    call_modal_dialog(title);
    setTimeout(function() { get_bs_modal('DIALOG_BOX').hide(); }, 3000);
}

function render_card_template(template_name, id, data) {
    var ul_template = plain_get_html_text(template_name);
    var template_html = Mustache.render(ul_template, data);
    plain_set_html_text(id, template_html);
}

function render_modal_dialog(title, template, data) {
    render_card_template(template, 'DIALOG_BODY', data);
    call_modal_dialog(title);
}

function onYouTubeIframeAPIReady() {
    window.yt_player = new YT.Player('FRAME_PLAYER', {
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    document.getElementById('FRAME_PLAYER').style.borderColor = '#FF6D00';
}

last_player_status = 0;
function onPlayerStateChange(event) {
    var player_status = event.data;
    // playerStatus: -1 : unstarted, 0 - ended, 1 - playing, 2 - paused, 3 - buffering, 5 - video cued
    if (last_player_status == 3 && player_status == -1) {
        show_modal_dialog('Video is not playable', 'Click Play List to Delete book');
    }
    if (player_status == 0) {
        play_next();
    }
    // console.log(`Player Status ${player_status} last: ${last_player_status}`);
    last_player_status = player_status;
}

function youtube_player_init() {
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function get_play_list() {
    var new_play_list = sessionStorage['playlist'];
    new_play_list = (new_play_list == undefined) ? new Array() : JSON.parse(new_play_list);
    return new_play_list;
}

function play_first() {
    var play_list = get_play_list();
    if (play_list.length <= 0) {
        return;
    }
    var parts = play_list[0].split(':');
    var video_id = parts[0];
    const time_str = '&t=';
    if (video_id.includes(time_str)) {
        var v_list = video_id.split(time_str);
        video_id = v_list[0];
        var start_time = parseInt(v_list[1].replace('s', ''));
        window.yt_player.loadVideoById({ videoId: video_id, startSeconds: start_time});
    } else {
        window.yt_player.loadVideoById({ videoId: video_id });
    }
}

function play_next() {
    var play_list = get_play_list();
    play_list.shift();
    sessionStorage['playlist'] = JSON.stringify(play_list);
    play_first();
}

function on_storage_event(storageEvent) {
    var play_list = get_play_list();
    if (play_list.length == 0) {
        return;
    }
    if (play_list.length > 1) {
        show_modal_dialog('Book added to Play List', 'Click Play List to Add/Delete Books');
        return;
    }
    play_first();
}

function menu_transliteration(lang) {
    var item_list = CATEGORY_DICT['categories']
    var map_dict = MAP_INFO_DICT[lang];
    for (var i = 0; i < item_list.length; i++) {
        var obj = item_list[i];
        var name = obj['C'];
        name = name.charAt(0).toUpperCase() + name.slice(1);
        obj['N'] = (lang == 'English') ? name : map_dict[name];
    }
    var playlist = 'Playlist';
    var search = 'Search';
    if (lang != 'English') {
        playlist = map_dict[playlist];
        search = map_dict[search];
    }
    let lang_list = [];
    for (var l in MAP_LANG_DICT) {
        var d = (l == window.GOT_LANGUAGE) ? { 'N' : l, 'O' : 'selected' } : { 'N' : l };
        lang_list.push(d);
    }
    var search_tooltip = 'Prefix Search <br/> e.g. pon sel<br/> Phonetic Search <br/> e.g. selvi <br/> Language Search <br/> e.g. கல்யாணி <br/> Context Search <br/> e.g. kalki : selvan : arun';
    var mic_tooltip = 'Only in Chrome';
    var kbd_tooltip = 'Language Keyboard';
    var other_dict = { 'P' : playlist, 'S' : search, 'STP' : search_tooltip, 'MTP' : mic_tooltip, 'KTP' : kbd_tooltip };
    var menu_dict = { 'menus' : { 'languages' : lang_list, 'search' : other_dict, 'playlist' : other_dict, 'categories' : CATEGORY_DICT['categories'] } };
    render_card_template('page-menu-template', 'MENU_DATA', menu_dict);
    init_search_listener();

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    });
    speech_to_text_init();
}

function check_for_english_text(lang, category, h_id, h_text) {
    if (lang != 'English') {
        return false;
    }
    if (ENGLISH_TYPE_LIST.includes(category)) {
        return true;
    }
    if (category != 'book') {
        return false;
    }
    if (h_id >= 20000) {
        return true;
    }
    if (h_text.includes(' - ')) {
        return true;
    }
    return false;
}

function info_transliteration(category, data_list) {
    var lang = window.RENDER_LANGUAGE;
    var map_dict = MAP_INFO_DICT[lang];

    var item = data_list['title']
    var h_text = item['H'];
    if (category == 'about') {
        var name = item['N'];
        item['N'] = (lang == 'English') ? name : map_dict[name];
    } else if (check_for_english_text(lang, category, 200, h_text)) {
        item['N'] = h_text;
    } else {
        var value = item['V'];
        if (lang != 'English' && value.includes('unknowncomposer')) {
            value = value.replace('unknowncomposer', '?');
        }
        item['N'] = get_transliterator_text(lang, value);
    }
    var item_list = data_list['stats']
    if (item_list == undefined) {
        item_list = [];
    }
    for (var i = 0; i < item_list.length; i++) {
        var obj = item_list[i];
        var name = obj['H'];
        obj['N'] = (lang == 'English') ? name : map_dict[name];
    }
    var note_list = new Set();
    var item_list = data_list['info']
    if (item_list == undefined) {
        item_list = [];
    }
    for (var i = 0; i < item_list.length; i++) {
        var obj = item_list[i];
        var name = obj['H'];
        obj['N'] = (lang != 'English' && name in map_dict) ? map_dict[name] : name;
        var value = obj['V'];
        if (name == 'Language') {
            if (lang != 'English' && name in map_dict) {
                obj['V'] = map_dict[value];
            }
        } else if (name == 'Name') {
            obj['V'] = get_transliterator_text(lang, value);
        } else if (name == 'Wiki') {
            obj['V'] = `<a href="https://ta.wikipedia.org/wiki/${value}" target="_blank">${value}</a>`;
        } else if (name == 'Read') {
            if (value != undefined) {
                var value_list = value;
                var read_list = [];
                for (var j = 0; j < value_list.length; j++) { 
                    var [h_name, h_value] = value_list[j];
                    h_name = get_transliterator_text(lang, h_name);
                    var href = `<a href="${h_value}" target="_blank">${h_name}</a>`;
                    read_list.push(href);
                }
                obj['V'] = read_list.join('<br/>');
            }
        } else if (name == 'Born' || name == 'Died') {
            if (value != undefined && typeof value === 'string') {
                var m_list = [];
                if (value.includes(' ')) {
                    m_list = value.split(' ');
                }
                if (m_list.length > 1 && lang in MAP_MONTH_DICT && m_list[1] in MAP_MONTH_DICT[lang]) {
                    obj['V'] = m_list[0] + ' ' + MAP_MONTH_DICT[lang][m_list[1]] + ' ' + m_list[2];
                }
            }
        } else if (lang != 'English' && name in map_dict) {
            value = obj['P'];
            if (value != undefined) {
                obj['V'] = get_transliterator_text(lang, value);
            }
        }
    }
}

function set_language(obj) {
    var got_lang = obj.value;
    window.GOT_LANGUAGE = got_lang;
    var lang = MAP_LANG_DICT[got_lang];
    window.RENDER_LANGUAGE = lang;
    var history_data = window.history_data;
    // console.log(`SET LANG: ${lang} ${got_lang} ${history_data}`);
    transliterator_lang_init(lang);
    menu_transliteration(lang);
    load_nav_data(window.NAV_CATEGORY);
    if (history_data == undefined) {
        load_content_data(window.CONTENT_CATGEGORY, window.CONTENT_NAME);
    } else  {
        handle_history_context(history_data);
    }
}

function load_lang_data() {
    var url = 'hk_lang_map.json';
    fetch(url).then(result => result.json()).then(map_data => {
        init_lang_maps(map_data);
        load_nav_data('author');
        if (window.default_book != '') {
            load_content_data('book', window.default_book);
        }
        search_init();
    });

}

function load_id_data() {
    var url = 'id.json';
    fetch(url).then(result => result.json()).then(id_data => {
        window.ID_DATA = id_data;
        load_lang_data()
    });
}

function add_book(audio_file) {
    var play_list = get_play_list();
    if (play_list.length <= 0) {
        if (audio_file != '') {
            play_list[0] = audio_file;
        }
    } else {
        play_list[play_list.length] = audio_file;
    }
    sessionStorage['playlist'] = JSON.stringify(play_list);
    if (play_list.length == 1) {
        play_first();
    } else {
        show_modal_dialog('Book added to Play List', 'Click Play List to Add/Delete Books');
    }
}

function delete_book(book_id) {
    var play_list = get_play_list();
    if (play_list.length > 0) {
        book_id = parseInt(book_id);
        play_list.splice(book_id, 1);
        sessionStorage['playlist'] = JSON.stringify(play_list);
        if (book_id == 0) {
            play_first();
        }
    }
}

function delete_row(row) {
    var row_id = row.parentNode.parentNode.rowIndex;
    handle_playlist_command('delete', row_id - 1);
    document.getElementById('PLAYLIST_TABLE').deleteRow(row_id);
}

function show_playlist() {
    var play_list = get_play_list();
    var info_list = [];
    for (var i = 0; i < play_list.length; i++) {
        var parts = play_list[i].split(':');
        info_dict = { 'N' : i + 1, 'I' : parts[0], 'B' : parseInt(parts[1]), 'A' : parseInt(parts[2]) };
        get_folder_value('book', info_dict, 'B', 'B');
        get_folder_value('author', info_dict, 'A', 'A');
        info_list.push(info_dict);
    }
    var lang = window.RENDER_LANGUAGE;
    var map_dict = MAP_INFO_DICT[lang];
    var header_dict = { 'N' : 'No.', 'I' : 'ID', 'SN' : 'Book', 'RN' : 'Author' };
    var playlist = 'Playlist';
    if (lang != 'English') {
        var map_dict = MAP_INFO_DICT[lang];
        playlist = map_dict[playlist];
        header_dict = { 'N' : 'No.', 'I' : 'ID', 'SN' : map_dict['Book'], 'RN' : map_dict['Author'] };
    }
    var header_list = [ header_dict ];
    var list_data = { 'playlist' : { 'header' : header_list, 'videos' : info_list } };
    render_modal_dialog(playlist, 'modal-playlist-template', list_data)
}

function handle_playlist_command(cmd, arg) {
    if (cmd == 'play') {
        var audio_file = arg;
        add_book(audio_file);
    } else if (cmd == 'delete') {
        var book_id = arg;
        delete_book(book_id);
    } else if (cmd == 'show') {
        show_playlist();
    }
    return true;
}

function render_nav_template(category, data) {
    var lang = window.RENDER_LANGUAGE;
    var letter_list = data['alphabet']
    var no_transliterate = lang == 'English' && ENGLISH_TYPE_LIST.includes(category);
    var id_data = window.ID_DATA[category];
    for (var k = 0; k < letter_list.length; k++) {
        var l_item = letter_list[k];
        var letter = l_item['LL'];
        l_item['TL'] = get_transliterator_text(lang, letter);
        var item_list = l_item['items'];
        for (var i = 0; i < item_list.length; i++) {
            var obj = item_list[i];
            var h_id = obj['H'];
            var h_text = id_data[h_id][0];
            var f_text = id_data[h_id][1];
            obj['H'] = h_text;
            if (lang != 'English' && f_text.includes('unknownauthor')) {
                f_text = f_text.replace('unknownauthor', '?');
            }
            if (check_for_english_text(lang, category, h_id, f_text)) {
                obj['N'] = h_text;
            } else {
                obj['N'] = (no_transliterate) ? h_text : get_transliterator_text(lang, f_text);
            }
        }
    }
    var ul_template = plain_get_html_text('nav-ul-template')
    var template_html = Mustache.render(ul_template, data);
    plain_set_html_text('MENU', template_html);
    if (window.NAV_SCROLL_SP != null) {
        window.NAV_SCROLL_SP.refresh();
    } else {
        var scroll_element = document.getElementById('ALPHABET_DATA');
        window.NAV_SCROLL_SPY = new bootstrap.ScrollSpy(scroll_element, { target: '#ALPHABET_LIST' });
        const scrollspy = document.querySelector('[data-bs-spy="scroll"]')
        scrollspy.addEventListener('activate.bs.scrollspy', (e) => {
            var a_list = plain_get_query_selector('a');
        })
    }
}

function load_about_data(category, video_data) {
    info_transliteration(category, video_data);
    render_card_template('page-title-template', 'PAGE_TITLE', video_data);
    render_card_template('page-about-template', 'PAGE_INFO', video_data);
    render_data_template('', '', video_data);
}

function load_nav_data(category) {
    if (category != 'about') {
        window.NAV_CATEGORY = category;
    }
    var url = category + '.json';
    fetch(url).then(result => result.json()).then(video_data => {
        if (category == 'about') {
            load_about_data(category, video_data);
        } else {
            render_nav_template(category, video_data);
        }
        add_history('nav', { 'category' : category });
    });
}

function get_folder_value(category, info, prefix, v) {
    var lang = window.RENDER_LANGUAGE;
    var id_data = window.ID_DATA[category];
    var h_name = prefix + 'D';
    var h_id = info[v];
    if (h_id == undefined) {
        console.log(`FOLDER: ${category} ${v}, ${info[v]} ${h_name}`);
        return;
    }
    var h_text = id_data[h_id][0];
    var f_text = id_data[h_id][1];
    if (h_text != 'UnknownType') {
        info[h_name] = h_text;
    }
    var f_name = prefix + 'N';
    if (lang != 'English' && h_id == 0) {
        info[f_name] = '?';
    } else if (check_for_english_text(lang, category, h_id, f_text)) {
        info[f_name] = h_text;
    } else {
        info[f_name] = get_transliterator_text(lang, f_text);
    }
}

function get_match_count(f_category, f_value, context_list, c_len) {
    var found = 0;
    for (var c = 1; c < c_len; c++) {
        if (context_list[c][0] == f_category && context_list[c][2] == f_value) {
            found += 1;
        }
    }
    return found;
}

function translate_folder_id_to_data(category, id, data) {
    var ff = FF[category];
    var f_category = ff[0];
    var f_type = ff[1];
    var sd = ff[2];
    var st = ff[3];
    var video_list = data['videos']
    for (var k = 0; k < video_list.length; k++) {
        var folder_list = video_list[k]['folder'];
        for (var i = 0; i < folder_list.length; i++) {
            var folder = folder_list[i];
            var book_list = folder['books'];
            var book_ids = '';
            if (category != 'book') {
                book_ids = folder['B'];
            }
            folder['HT'] = f_category;
            folder['HC'] = book_list.length;
            get_folder_value(f_category, folder, 'H', f_type);
            for (var j = 0; j < book_list.length; j++) {
                var book = book_list[j];
                for (var m = 0; m < OF.length; m++) {
                    var c = OF[m] + 'T';
                    book[c] = st[m];
                    get_folder_value(st[m], book, OF[m], sd[m]);
                }
                if (category == 'book') {
                    book_ids = book['B'];
                }
                book['PS'] = book_ids;
                book['PR'] = book['A'];
            }
        }
    }
}

function render_data_template(category, id, data, context_list) {
    var lang = window.RENDER_LANGUAGE;
    if (category == '') {
        plain_set_html_text('PAGE_VIDEOS', '');
        plain_set_html_text('PAGE_LYRICS', '');
        plain_set_html_text('PAGE_REFS', '');
        return;
    }

    var template_name = 'page-videos-template'
    var ul_template = plain_get_html_text(template_name);
    if (lang != 'English') {
        var map_dict = MAP_INFO_DICT[lang];
        ul_template = ul_template.replace('Videos', map_dict['Videos']);
        ul_template = ul_template.replace('Views', map_dict['Views']);
    }

    translate_folder_id_to_data(category, id, data);

    if (context_list != undefined) {
        var video_list = data['videos']
        var c_len = context_list.length;
        for (var k = 0; k < video_list.length; k++) {
            var folder_list = video_list[k]['folder']
            var new_folder_list = [];
            for (var i = 0; i < folder_list.length; i++) {
                var folder = folder_list[i];
                var f_category = folder['HT'];
                var f_value = folder['HN'];
                var s_found = get_match_count(f_category, f_value, context_list, c_len);
                var book_list = folder['books'];
                var new_book_list = [];
                for (var j = 0; j < book_list.length; j++) {
                    var book = book_list[j];
                    var found = s_found;
                    for (var m = 0; m < OF.length; m++) {
                        var c = OF[m] + 'T';
                        var f_category = book[c];
                        var c = OF[m] + 'N';
                        var f_value = book[c];
                        found += get_match_count(f_category, f_value, context_list, c_len);
                    }
                    if (found >= (c_len - 1)) {
                        new_book_list.push(book);
                    }
                }
                folder['books'] = new_book_list;
                if (new_book_list.length > 0) {
                    new_folder_list.push(folder);
                }
            }
            video_list[k]['folder'] = new_folder_list;
        }
    }

    var template_html = Mustache.render(ul_template, data);
    plain_set_html_text(id, template_html);
}

function render_content_data(category, name, video_data, context_list) {
    plain_set_html_text('PAGE_INFO', '');
    info_transliteration(category, video_data);
    render_card_template('page-title-template', 'PAGE_TITLE', video_data);
    render_card_template('page-info-template', 'PAGE_INFO', video_data);
    render_data_template(category, 'PAGE_VIDEOS', video_data, context_list);
    render_card_template('page-lyrics-text-template', 'PAGE_LYRICS', video_data);
    render_card_template('page-lyrics-ref-template', 'PAGE_REFS', video_data);
    window.scrollTo(0, 0);
}

function load_content_data(category, name) {
    window.CONTENT_CATGEGORY = category;
    window.CONTENT_NAME = name;
    var url = `${category}/${name}.json`;
    fetch(url).then(result => result.json()).then(video_data => {
        render_content_data(category, name, video_data);
        add_history('content', { 'category' : category, 'name' : name });
    });
}

function load_context_search_data(context_list) {
    var option_list = context_list[0].split(':');
    var category = option_list[0];
    var name = option_list[1];
    var new_context_list = [];
    for (var i = 0; i < context_list.length; i++) {
        new_context_list.push(context_list[i].split(':'));
    }
    window.CONTENT_CATGEGORY = category;
    window.CONTENT_NAME = name;
    var url = `${category}/${name}.json`;
    fetch(url).then(result => result.json()).then(video_data => {
        render_content_data(category, name, video_data, new_context_list);
    });
}

function normalize_search_text(search_text) {
    search_text = search_text.toLowerCase();
    search_text = search_text.replace(/(e)\1+/g, 'i');
    search_text = search_text.replace(/(o)\1+/g, 'u');
    search_text = search_text.replace(/(.)\1+/g, '$1');
    search_text = search_text.replace(/([bcdfgjklpst])h/g, '$1')
    search_text = search_text.replace(/([sd])v/g, '$1w')
    search_text = search_text.replace(/([ao])u/g, 'ow')
    return search_text;
}

function search_load() {
    if (window.search_initialized) {
        return;
    }

    var url = 'search_index.json';
    var search_engine = window.carnatic_search_engine;
    fetch(url).then(result => result.json()).then(search_index_obj => {
        var data_id = 0;
        var search_obj = search_index_obj['Search'];
        for (var category in search_obj) {
            var data_list = search_obj[category];
            data_list.forEach(function (data_item, data_index) {
                var h_id = data_item.H;
                var aka_list = data_item.A.split(',');
                var data_doc = { 'id' : data_id, 'href' : h_id, 'title' : h_id, 'aka' : aka_list, 'category' : category, 'pop' : data_item.P };
                search_engine.add(data_doc);
                data_id += 1;
            });
        }
        window.CARNATIC_CHAR_MAP = search_index_obj['Charmap'];
        transliterator_init();
    });

    window.search_initialized = true;
}

function search_init() {
    window.carnatic_search_engine = new MiniSearch({
        fields: ['aka'], // fields to index for full-text search
        storeFields: ['title', 'href', 'category', 'pop'] // fields to return with search results
    });
    window.search_initialized = false;
    search_load();
}

function get_search_results(search_word, search_options, item_list, id_list, base_pop) {
    var word_list = search_word.split(' ');
    var new_word_list = [];
    for (var i = 0; i < word_list.length; i++) {
        var word = word_list[i];
        if (word != '') {
            word = normalize_search_text(word);
            new_word_list.push(word.slice(0,8));
        }
        search_word = new_word_list.join(' ');
    }
    var lang = window.RENDER_LANGUAGE;
    var map_dict = MAP_INFO_DICT[lang];
    var search_engine = window.carnatic_search_engine;
    var results = search_engine.search(search_word, search_options);
    if (results.length <= 0) return;
    var max_score = results[0].score;
    for (var i = 0; i < results.length; i++) {
        var result_item = results[i];
        if (id_list.has(result_item.id)) continue;
        var pop = result_item.pop;
        if (search_word.length > 2) {
            pop = ((400 * result_item.score) / max_score) + (0.6 * pop);
        }
        pop = base_pop + pop;
        var category = result_item.category
        var id_data = window.ID_DATA[category];
        var c_name = category.charAt(0).toUpperCase() + category.slice(1);
        var n_category = (lang == 'English') ? category.toUpperCase() : map_dict[c_name];
        var href = id_data[result_item.href][0];
        var title = id_data[result_item.title][1];
        if (check_for_english_text(lang, category, result_item.href, href)) {
            title = href;
        } else {
            title = get_transliterator_text(lang, title);
        }
        var item = { 'T' : category, 'C' : n_category, 'I' : AUDIO_BOOK_ICON_DICT[category], 'H' : href, 'N' : title, 'P' : pop };
        item_list.push(item);
        id_list.add(result_item.id);
    }
}

function transliterator_init() {
    var char_map = window.CARNATIC_CHAR_MAP;
    var key_list = [];
    var max_len = 0;
    for (var s in char_map) {
        key_list.push(s);
        max_len = Math.max(max_len, s.length);
    }
    window.CHAR_MAP_MAX_LENGTH = max_len;
    window.CHAR_MAP_KEY_LIST = new Set(key_list);

    set_tamil_regex_list();
}

function transliterate_text(word) {
    var char_map = window.CARNATIC_CHAR_MAP;
    var tokenset = window.CHAR_MAP_KEY_LIST;
    var maxlen = window.CHAR_MAP_MAX_LENGTH;
    var current = 0;
    var tokenlist = [];
    word = word.toString();
    while (current < word.length) {
        var nextstr = word.slice(current, current+maxlen);
        var p = nextstr[0];
        var j = 1;
        var i = maxlen;
        while (i > 0) {
            var s = nextstr.slice(0, i);
            if (tokenset.has(s)) {
                p = s;
                j = i;
                break
            }
            i -= 1;
        }
        if (p in char_map) {
            p = char_map[p];
        }
        tokenlist.push(p);
        current += j;
    }
    var new_word = tokenlist.join('');
    if (word != new_word) {
        new_word = new_word.replace(/_/g, '');
        new_word = new_word.replace(/G/g, 'n');
        new_word = new_word.replace(/J/g, 'n');
    }
    return new_word;
}

function get_tamil_phonetic_word(word) {
    var w_list = [];
    var new_word = word.toLowerCase();
    for (var i = 0; i < new_word.length; i++) {
        var c = new_word[i];
        w_list.push((c in SEARCH_MAP_DICT) ? SEARCH_MAP_DICT[c] : c);
    }
    return w_list.join('');
}

function load_search_part(search_word, non_english) {
    var s_search_word = search_word.replace(/\s/g, '');
    var item_list = [];
    var id_list = new Set();
    var search_options = { prefix: true, combineWith: 'AND', fuzzy: term => term.length > 3 ? 0.1 : null };
    get_search_results(search_word, search_options, item_list, id_list, 4000);
    if (search_word != s_search_word) {
        get_search_results(s_search_word, search_options, item_list, id_list, 1000);
    }
    var n_search_word = '';
    if (non_english) {
        n_search_word = get_tamil_phonetic_word(search_word);
        get_search_results(n_search_word, search_options, item_list, id_list, 5000);
    }
    if (search_word.length > 2) {
        var search_options = { prefix: true, combineWith: 'AND', fuzzy: term => term.length > 3 ? 0.3 : null };
        get_search_results(search_word, search_options, item_list, id_list, 0);
        if (non_english && n_search_word) {
            get_search_results(n_search_word, search_options, item_list, id_list, 0);
        }
        if (search_word != s_search_word) {
            get_search_results(s_search_word, search_options, item_list, id_list, 0);
        }
    }
    item_list.sort(function (a, b) { return b.P - a.P; });
    var new_item_list = item_list.slice(0, 25);
    return new_item_list;
}

function handle_search_word(search_word) {
    var lang = window.RENDER_LANGUAGE;
    var c = search_word.charCodeAt(0);
    if (c > 127) {
        search_word = transliterate_text(search_word);
    }
    var non_english = (0x0B80 <= c && c <= 0x0BFF) ? true : false;

    var context_dict = {};
    var context_list = search_word.split(':');
    for (var i = 0; i < context_list.length; i++) {
        var word = context_list[i];
        var new_item_list = load_search_part(word, non_english);
        context_dict[word] = new_item_list;
    }
    var result_header = 'Search Results';
    if (lang != 'English') {
        var map_dict = MAP_INFO_DICT[lang];
        result_header = map_dict[result_header];
    }
    var item_data = { 'title' : { 'N': result_header, 'I': 'search' }, 'items' : new_item_list };
    render_card_template('page-title-template', 'PAGE_TITLE', item_data);
    if (context_list.length <= 1) {
        render_card_template('page-search-template', 'PAGE_INFO', item_data);
    } else {
        var row_list = [];
        for (var i = 0; i < context_list.length; i++) {
            var w = context_list[i];
            row_list.push({ 'I' : i, 'col' : context_dict[w] });
        }
        var row_data = { 'items' : row_list };
        render_card_template('page-context-search-template', 'PAGE_INFO', row_data);
    }
    render_data_template('', '', item_data);
    window.scrollTo(0, 0);
    add_history('search', { 'category' : window.NAV_CATEGORY, 'search' : search_word });
}

function load_search_data() {
    var search_word = document.getElementById('SEARCH_WORD').value;
    var search_word = decodeURI(search_word);
    handle_search_word(search_word);
}

function init_search_listener() {
    var element = document.getElementById('SEARCH_WORD');
    element.addEventListener('input', load_search_data);
}

function load_search_history(data) {
    var search_word = data['search'];
    document.getElementById('SEARCH_WORD').value = search_word;
    handle_search_word(search_word);
}

function handle_context_search() {
    var select_list = plain_get_query_selector('select[id^=COL_]');
    var cols = select_list.length;
    var context_list = [];
    for (var i = 0; i < select_list.length; i++) {
        var select_element = select_list[i];
        var option = select_element.options[select_element.selectedIndex].value;
        if (option == '' || option == undefined) {
            continue;
        }
        var new_option = option.replace(/\s/g, '');
        if (new_option == '' || new_option == undefined) {
            continue;
        }
        context_list.push(option);
    }
    load_context_search_data(context_list);
}

function get_youtube_video_info(id) {
    var url = `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${id}&format=json`
    fetch(url).then(result => result.json()).then(video_data => {
        var info_list = [];
        for (var key in video_data) {
            if (VIDEO_INFO_KEY_LIST.has(key)) {
                var value = video_data[key];
                info_list.push({ 'N' : key, 'C' : value });
            }
        }
        var video_id = id.split('&')[0];
        var image = video_data['thumbnail_url'];
        var info_data = { 'videoinfo' : info_list, 'videoimage' : { 'I' : video_id, 'P' : image } };
        render_modal_dialog(id, 'modal-videoinfo-template', info_data)
    });
}

/*
    Speech To Text
*/

function speech_to_text_init() {
    window.speech_recognizing = false;
    window.speech_final_transcript = '';
    window.speech_recognizing = false;
    window.speech_ignore_onend;
    window.speech_start_timestamp;
    if (!('webkitSpeechRecognition' in window)) {
        console.log('Speech not working:');
    } else {
        window.speech_recognition = new webkitSpeechRecognition();
        window.speech_recognition.continuous = true;
        window.speech_recognition.interimResults = true;

        window.speech_recognition.onstart = function() {
            window.speech_recognizing = true;
            console.log('Speech Starting:');
        };

        window.speech_recognition.onerror = function(event) {
            if (event.error == 'no-speech') {
                console.log('Speech Error: No Speech');
                window.speech_ignore_onend = true;
            }
            if (event.error == 'audio-capture') {
                console.log('Speech Error: Audio Capture');
              window.speech_ignore_onend = true;
            }
            if (event.error == 'not-allowed') {
                if (event.timeStamp - window.speech_start_timestamp < 100) {
                    console.log('Speech Error: Info Blocked');
                } else {
                    console.log('Speech Error: Info Denied');
                }
                window.speech_ignore_onend = true;
            }
        };

        window.speech_recognition.onend = function() {
            window.speech_recognizing = false;
            if (window.speech_ignore_onend) {
                console.log('Speech Error: Ignore End');
                return;
            }
            if (!window.speech_final_transcript) {
                console.log('Speech End:');
                return;
            }
        };

        window.speech_recognition.onresult = function(event) {
            var interim_transcript = '';
            /*
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    window.speech_final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
                console.log('Speech Interim: ' + event.resultIndex + ' ' + event.results.length + ' ' + event.results[i][0].transcript);
            }
            console.log('Speech Result: ' + event.resultIndex + ' ' + event.results.length + ' ' + interim_transcript);
            */
            if (event.results.length > 0) {
                window.speech_final_transcript = event.results[0][0].transcript;
            } else {
                window.speech_final_transcript = '';
            }
            if (window.speech_final_transcript || interim_transcript) {
                window.speech_recognition.stop();
                plain_set_attr('MIC_IMAGE', 'src', 'icons/mic-mute.svg');
                document.getElementById('SEARCH_WORD').value = window.speech_final_transcript;
                // console.log('Speech Final: ' + window.speech_final_transcript);
                load_search_data();
            }
        };
    }
}

function speech_start(event) {
    if (!('webkitSpeechRecognition' in window)) {
        return;
    }
    if (window.speech_recognizing) {
        window.speech_recognition.stop();
        return;
    }
    var lang = window.RENDER_LANGUAGE;
    window.speech_final_transcript = '';
    window.speech_recognition.lang = MAP_ISO_DICT[lang];
    window.speech_recognition.start();
    window.speech_ignore_onend = false;
    window.speech_start_timestamp = event.timeStamp;
    plain_set_attr('MIC_IMAGE', 'src', 'icons/mic.svg');
}

function load_keyboard(event) {
    var lang = window.RENDER_LANGUAGE;
    set_input_keyboard(lang.toLowerCase());
    get_bs_modal('LANG_KBD').show();
}

function handle_history_context(data) {
    var context = data['context'];
    if (context == 'content') {
        load_content_data(data['category'], data['name']);
    } else if (context == 'nav') {
        load_nav_data(data['category']);
    } else if (context == 'search') {
        load_search_history(data);
    }
}

function handle_popstate(e) {
    var data = e.state;
    if (data == null || data == undefined) {
        return;
    }
    // console.log('POP: ', e);
    window.carnatic_popstate = true;
    handle_history_context(data);
    var lang = data['language'];
    // set_language({ 'value' : lang });
}

function add_history(context, data) {
    var url = window.collection_name + '.html';
    /*
    if (context == 'nav') {
        return;
    }
    */
    data['language'] = window.GOT_LANGUAGE;
    if (!window.carnatic_popstate) {
        data['context'] = context;
        var title = 'Carnatic: ' + capitalize_word(data['category']);
        var name = data['name'];
        if (name != undefined) {
            title += ' ' + name;
        }
        // console.log('PUSH: ', data, window.carnatic_popstate);
        history.pushState(data, title, url);
    }
    window.history_data = data;
    window.carnatic_popstate = false;
}

function load_youtube_frame() {
    var value = plain_get_attr('FRAME_PLAYER', 'data-src');
    plain_set_attr('FRAME_PLAYER', 'src', value);
    youtube_player_init();
}

function load_content() {
    if (window.innerWidth < 992) {
        show_modal_dialog('Best Viewed in Landscape Mode', 'Use Landscape Mode');
    }
    var a_list = plain_get_query_selector('#MENU_DATA li a');
    for (var i = 0; i < a_list.length; i++) {
        a_list[i].addEventListener('click', function() {
            var active_list = plain_get_query_selector('#MENU_DATA li.active');
            for (var j = 0; j < active_list.length; j++) {
                active_list[j].classList.remove('active');
            }
            this.parentNode.classList.add('active');
        });
    }

    load_id_data();
}

function collection_init(collection, default_book) {
    var lang = 'Tamil';
    window.collection_name = collection;
    window.default_book = default_book;

    window.RENDER_LANGUAGE = lang;
    window.GOT_LANGUAGE = lang;
    set_tamil_regex_list();

    window.history_data = undefined;
    window.carnatic_popstate = false;

    window.NAV_SCROLL_SPY = null;

    sessionStorage.clear();
    window.addEventListener('storage', on_storage_event, false);
    window.addEventListener('popstate', handle_popstate);
    window.onload = load_content;

    // Ready function
    document.addEventListener('DOMContentLoaded', function() {
        // console.log(`DOMContentLoaded: ${document.readyState}`);
        if (document.readyState === "interactive" || document.readyState === "complete" ) {
            var li_list = plain_get_query_selector('#MENU_DATA li');
            for (var i = 0; i < li_list.length; i++) {
                li_list[i].addEventListener('bind', function() {
                    this.classList.add('active');
                });
            }
            setTimeout(load_youtube_frame, 3000);
        }
    });

    init_input_keyboard();
    menu_transliteration(lang);
    load_nav_data('about');
}

