import { MdAdd, MdCheck, MdClose, MdKeyboardArrowDown } from "react-icons/md";
import { LuSettings2 } from "react-icons/lu";
import { observer } from "mobx-react-lite";
import * as Popover from "@radix-ui/react-popover";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Select from "@radix-ui/react-select";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { tagTypeStrings } from "@/models";
import {
    useSettingsStore,
    TagFilterLogicOptions,
    TagSortOptions,
    Dialogs,
    globalDialogStore,
    useDataStore,
} from "@/stores";
import { SidebarTagButton, IconButton, CenterAndEdgesRow, ScrollView } from "@/components";
import "./TagButtonGroup.css";

export const SidebarTagButtonGroup = observer(({ tagType }) => {
    const { allTags } = useDataStore();
    const title = tagTypeStrings[tagType].plural.toUpperCase();
    const handleAddButtonClick = () => {
        globalDialogStore.open(Dialogs.EditTag, { addingTagOfType: tagType });
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

                    <p>Sort {tagTypeStrings[tagType].plural} by</p>
                    <Select.Root
                        value={settingsStore.tagSortMethods[tagType]}
                        className="rx-select"
                        onValueChange={(option) => settingsStore.setTagSort(tagType, option)}
                    >
                        <Select.Trigger
                            className="rx-select-trigger"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
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
                    <ToggleGroup.Root
                        type="single"
                        className="rx-toggle-group"
                        value={settingsStore.tagSortDirection[tagType]}
                        onValueChange={(option) =>
                            settingsStore.setTagSortDirection(tagType, option)
                        }
                    >
                        <ToggleGroup.Item value="asc">Ascending</ToggleGroup.Item>
                        <ToggleGroup.Item value="desc">Descending</ToggleGroup.Item>
                    </ToggleGroup.Root>
                    <div className="spacer" />

                    <p>Selecting {tagTypeStrings[tagType].plural} will filter for games that</p>
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
