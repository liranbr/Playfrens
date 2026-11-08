// Unverified labels, see CONTENT_DESCRIPTOR.md for explanation.
export const ContentDescriptor = Object.freeze({
    SOME_NUDITY_OR_SEXUAL_CONTENT: 1, // has mild sexual content, e.g. BG3 and Skyrim, The Forest
    FREQUENT_VIOLENCE_OR_GORE: 2, // has violence or gore as its theme, e.g. Fallout, Doom games, The Forest, Corpse Party
    ADULT_ONLY_SEXUAL_CONTENT: 3, // the game's actual entire purpose is porn.
    FREQUENT_NUDITY_OR_SEXUAL_CONTENT: 4, // it seems to be always matched with descriptor 3.
    GENERAL_MATURE_CONTENT: 5, // pretty much on any game that is flagged 18+ regardless of nudity or not.
});
