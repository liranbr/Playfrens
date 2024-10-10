import {Bounce, toast} from "react-toastify";

const toastOptions = {
    position: "bottom-center",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
};

export function toastError(message) {
    toast.error(message, toastOptions);
}

export function toastSuccess(message) {
    toast.success(message, toastOptions);
}