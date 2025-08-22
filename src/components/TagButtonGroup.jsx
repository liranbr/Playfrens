import { MdAdd, MdClose } from "react-icons/md";
import { LuSettings2 } from "react-icons/lu";
import { observer } from "mobx-react-lite";
import * as Popover from "@radix-ui/react-popover";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { tagTypeStrings } from "@/models";
import {
    useSettingsStore,
    TagFilterLogicOptions,
    Dialogs,
    dialogStore,
    useDataStore,
} from "@/stores";
import { SidebarTagButton, IconButton, CenterAndEdgesRow, ScrollView } from "@/components";
import "./TagButtonGroup.css";

export const SidebarTagButtonGroup = observer(({ tagType }) => {
    const { allTags } = useDataStore();
    const title = tagTypeStrings[tagType].plural.toUpperCase();
    const handleAddButtonClick = () => {
        dialogStore.open(Dialogs.EditTag, { addingTagOfType: tagType });
    };
    return (
        <div className="tag-button-group">
            <CenterAndEdgesRow className="ui-card-header">
                <SidebarTBGMenu tagType={tagType} />
                <h4>{title}</h4>
                <IconButton icon={<MdAdd />} onClick={handleAddButtonClick} />
            </CenterAndEdgesRow>
            <ScrollView>
                <div className="tag-button-list">
                    {[...allTags[tagType]].map(([id, tag], index) => (
                        <SidebarTagButton key={index} tag={tag} />
                    ))}
                </div>
            </ScrollView>
        </div>
    );
});

const SidebarTBGMenu = observer(({ tagType }) => {
    const settingsStore = useSettingsStore();
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <IconButton icon={<LuSettings2 fontSize={18} />} />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content align="start" className="sidebar-popover-content">
                    <Popover.Close asChild>
                        <IconButton className="popover-close" icon={<MdClose />} />
                    </Popover.Close>
                    <h3>{tagTypeStrings[tagType].plural} Settings</h3>
                    <p>Selected {tagTypeStrings[tagType].plural} will filter for games that</p>
                    <RadioGroup.Root
                        defaultValue={settingsStore.tagFilterLogic[tagType]}
                        className="rx-radio-group"
                        onValueChange={(option) => settingsStore.setTagFilterLogic(tagType, option)}
                    >
                        {Object.keys(TagFilterLogicOptions).map((option) => (
                            <label htmlFor={option} key={option}>
                                <RadioGroup.Item value={option} id={option} autoFocus />
                                {TagFilterLogicOptions[option]}
                            </label>
                        ))}
                    </RadioGroup.Root>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
});
