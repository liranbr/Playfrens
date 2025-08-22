import { reaction } from "mobx";

// Makes MobX reactions easier to work with, by storing the reaction and its disposer to more easily enable/disable
export class SortingReaction {
    watchedValueFunction;
    sortingMethod;
    disposer;
    constructor(watchedValueFunction, sortingMethod) {
        this.watchedValueFunction = watchedValueFunction;
        this.sortingMethod = sortingMethod;
        this.disposer = null;
    }

    enable() {
        this.disposer = reaction(this.watchedValueFunction, this.sortingMethod, {
            fireImmediately: true,
        });
    }

    disable() {
        if (!this.disposer)
            console.error("No disposer found. sortingMethod: " + this.sortingMethod);
        else this.disposer();
    }
}
