import {useEffect, useRef} from "react";

export const useUpdatedOnRenderRef = <T>(value: T) => {
    const ref = useRef(value);

    useEffect(() => {
        ref.current = value;
    });

    return ref;
};
