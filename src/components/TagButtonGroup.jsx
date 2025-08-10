import { MdAdd, MdCheck, MdClose, MdKeyboardArrowDown } from "react-icons/md";
import { LuSettings2 } from "react-icons/lu";
import { observer } from "mobx-react-lite";
import * as Popover from "@radix-ui/react-popover";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Select from "@radix-ui/react-select";
import { useSettingsStore, TagFilterLogicOptions, TagSortOptions } from "@/stores";
import { SidebarTagButton, IconButton, CenterAndEdgesRow, ScrollView } from "@/components";
import { Dialogs, dialogStore } from "./Dialogs/DialogStore.jsx";
import "./TagButtonGroup.css";

export const SidebarTagButtonGroup = observer(({ tagType }) => {
    const title = tagType.plural.toUpperCase();
    const handleAddButtonClick = () => {
        dialogStore.open(Dialogs.EditTag, { tagType: tagType });
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
                    {tagType.allTagsList.map((tagName, index) => (
                        <SidebarTagButton key={index} tagName={tagName} tagType={tagType} />
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
                    <h3>{tagType.plural} Settings</h3>
                    <p>Selected {tagType.plural} filter for games that</p>
                    <RadioGroup.Root
                        defaultValue={settingsStore.tagFilterLogic[tagType.key]}
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
                    <div className="spacer" />

                    <p>Sort {tagType.plural} by</p>
                    <Select.Root
                        value={settingsStore.tagSort[tagType.key]}
                        className="rx-select"
                        onValueChange={(option) => settingsStore.setTagSort(tagType, option)}
                    >
                        <Select.Trigger className="rx-select-trigger">
                            <Select.Value />
                            <Select.Icon children={<MdKeyboardArrowDown />} />
                        </Select.Trigger>
                        <Select.Content position="popper" className="rx-select-content">
                            <Select.Viewport>
                                {Object.keys(TagSortOptions).map((option) => (
                                    <Select.Item value={option} key={option}>
                                        <Select.ItemText>{TagSortOptions[option]}</Select.ItemText>
                                        <Select.ItemIndicator className="item-indicator">
                                            <MdCheck />
                                        </Select.ItemIndicator>
                                    </Select.Item>
                                ))}
                            </Select.Viewport>
                        </Select.Content>
                    </Select.Root>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
});
