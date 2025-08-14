"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoFormat = exports.WordType = exports.GameState = void 0;
var GameState;
(function (GameState) {
    GameState["WAITING_FOR_PLAYERS"] = "waiting_for_players";
    GameState["COLLECTING_WORDS"] = "collecting_words";
    GameState["GENERATING_STORY"] = "generating_story";
    GameState["DISPLAYING_STORY"] = "displaying_story";
    GameState["CREATING_VIDEO"] = "creating_video";
    GameState["COMPLETED"] = "completed";
})(GameState || (exports.GameState = GameState = {}));
var WordType;
(function (WordType) {
    WordType["NOUN"] = "noun";
    WordType["VERB"] = "verb";
    WordType["ADJECTIVE"] = "adjective";
    WordType["ADVERB"] = "adverb";
    WordType["PLURAL_NOUN"] = "plural_noun";
    WordType["PAST_TENSE_VERB"] = "past_tense_verb";
    WordType["COLOR"] = "color";
    WordType["NUMBER"] = "number";
    WordType["PLACE"] = "place";
    WordType["PERSON"] = "person";
})(WordType || (exports.WordType = WordType = {}));
var VideoFormat;
(function (VideoFormat) {
    VideoFormat["MP4"] = "mp4";
    VideoFormat["WEBM"] = "webm";
})(VideoFormat || (exports.VideoFormat = VideoFormat = {}));
