import * as Tooltip from "@radix-ui/react-tooltip";

/**
 * A standard hover tooltip component, to skip the verbose subcomponents
 * @param {{
 *   message: string,
 *   delayDuration: number,
 *   className?: string,
 *   children?: React.ReactNode,
 * }} props
 * @returns {JSX.Element}
 */
export function SimpleTooltip({ message, delayDuration = 750, className = "", children }) {
    return (
        <Tooltip.Root delayDuration={delayDuration}>
            <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
            <Tooltip.Content sideOffset={5} className={`rx-tooltip ${className}`}>
                {message}
            </Tooltip.Content>
        </Tooltip.Root>
    );
}
