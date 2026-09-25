import { observer } from "mobx-react-lite";
import { MdShare } from "react-icons/md";
import { tagTypeStrings } from "@/models";
import { globalDataStore, useFilterStore, useUserStore } from "@/stores";
import { Dropdown, IconButton } from "@/components";
import { toastError, toastSuccess } from "@/Utils";

export const ShareGamesAsText = observer(() => {
    const { search, selectedTagIDs, excludedTagIDs, areFiltersActive, filteredGames } =
        useFilterStore();
    const { userInfo } = useUserStore();
    const makeFiltersText = () => {
        if (!areFiltersActive) return "**No filters active**";
        const currentFilters = [];
        if (search) currentFilters.push("**Search:** " + search);
        const tagFiltersLine = (tagSets, filterText) => {
            if (Object.values(tagSets).some((set) => set.size > 0)) {
                const selectedTagsText = [];
                for (const tagType in tagSets) {
                    if (tagSets[tagType].size > 0) {
                        const tagPlural = tagTypeStrings[tagType].plural;
                        const tagNames = Array.from(tagSets[tagType]).map(
                            (id) => globalDataStore.getTagByID(id, tagType).name,
                        );
                        selectedTagsText.push(`* ${tagPlural} [${tagNames.join(", ")}]`);
                    }
                }
                currentFilters.push(filterText, ...selectedTagsText);
            }
        };
        tagFiltersLine(selectedTagIDs, "**Selected Tags:**");
        tagFiltersLine(excludedTagIDs, "~~Excluded Tags:~~");

        return currentFilters.join("  \n");
    };
    const makeGamesText = (withLinks) => {
        const currentGames = [`### ${filteredGames.length} Games`];
        filteredGames.forEach((game) => {
            // If it's a steam game, format the title as a link to its store page
            if (withLinks && !!game.storeID && game.storeType === "steam") {
                const steamLink = "https://s.team/a/" + game.storeID; // using official s.team shortener to fit more games in one message
                currentGames.push("* [" + game.title + "](<" + steamLink + ">)");
            } else currentGames.push("* " + game.title);
        });

        return currentGames.join("  \n");
    };
    const handleCopy = async (withLinks) => {
        const pfLink = "https://playfrens.com/";
        try {
            const text = [
                `## ${userInfo.displayName}'s [Playfrens](<${pfLink}>) Board`,
                makeFiltersText(),
                makeGamesText(withLinks),
            ].join("  \n");
            await navigator.clipboard.writeText(text);
            toastSuccess("Copied to clipboard!");
        } catch (err) {
            const errMsg = "Failed to copy text: " + err;
            console.error(errMsg);
            toastError(errMsg);
        }
    };

    return (
        <Dropdown
            trigger={<IconButton icon={<MdShare />} onClick={handleCopy} />}
            tooltip="Share current games"
        >
            <Dropdown.Item onClick={() => handleCopy(true)}>Share as text</Dropdown.Item>
            <Dropdown.Item onClick={() => handleCopy(false)}>
                Share as text without links
            </Dropdown.Item>
        </Dropdown>
    );
});
