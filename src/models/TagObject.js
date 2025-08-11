import { tagTypes } from "@/models/TagTypes.jsx";
import { makeAutoObservable } from "mobx";

export class TagObject {
    constructor(tagTypeKey, name, id = crypto.randomUUID()) {
        this.tagTypeKey = tagTypeKey;
        this.name = name;
        this.id = id;

        // Ensure the tag type exists
        if (!tagTypes[tagTypeKey]) {
            throw new Error(`Invalid tag type: ${tagTypeKey}`);
        }
        makeAutoObservable(this);
    }

    get tagType() {
        return tagTypes[this.tagTypeKey];
    }
}

// for later, when Friends get unique properties like DiscordID, SteamID, ProfilePictureURL, etc.
class FriendTagObject extends TagObject {
    constructor(name, id) {
        super(tagTypes.friend.key, name, id);
    }
}
