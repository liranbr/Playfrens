import { observer } from "mobx-react-lite";
import "./ReminderCard.css";

export const ReminderCard = observer(({ reminder }) => {
    const dateHasPassed = reminder.date < new Date();

    return (
        <span className={"reminder" + (dateHasPassed ? " activated" : "")}>
            <label>{reminder.getFormattedDate()}</label>
            <p>{reminder.message}</p>
        </span>
    );
});
