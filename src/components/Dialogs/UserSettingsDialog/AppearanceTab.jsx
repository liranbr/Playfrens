import { observer } from "mobx-react-lite";
import { Settings } from "@/components";
import { useSettingsStore } from "@/stores";

const { Section, Setting } = Settings;

export const AppearanceTab = observer(() => {
    const { user } = useSettingsStore();

    return (
        <>
            <Section title="Sidebar" subtitle="How tags look and behave in the sidebar">
                <Setting setting={user.tagHoverGameHighlight} />
                <Setting setting={user.tagGameCounterDisplay} />
                <Setting setting={user.friendIconDisplay} />
            </Section>

            <Section title="Games Grid" subtitle="Layout of the game cards">
                <Setting setting={user.gamesGridCardWidth} />
                <Setting setting={user.toggleCompactGameGrid} />
                <Setting setting={user.toggleHideGameStoreButtons} />
                <Setting setting={user.hideMatureContent} />
            </Section>

            <Section title="Accessability">
                <Setting setting={user.fontSize} />
                <Setting setting={user.reduceMotion} />
            </Section>
        </>
    );
});

