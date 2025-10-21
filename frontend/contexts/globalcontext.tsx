import React, {createContext, useContext, useState, useEffect, useMemo} from "react"

type User = {
    firsttName: string | null;
    lastName: string | null;
}

const GlobalContext = createContext<User | undefined>(undefined);

export const GlobalProvider = ({children} : {children: React.ReactNode}) => {
    const [firsttName, setFirstName] = useState<string | null>(null);
    const [lastName, setLastName] = useState<string | null>(null);


    const globalValues = useMemo(() => ({
        // variables
        firsttName,
        lastName,


        // functions
        setFirstName,
        setLastName
    }), [
        firsttName,
        lastName
    ]);

    return (
        <GlobalContext.Provider
            value={globalValues}
        >
            {children}
        </GlobalContext.Provider>
    )
}

export const useGlobal = () => {
    const ctx = useContext(GlobalContext);
    if (!ctx) throw new Error("useGlobal must be ued within the provider");
    return ctx;
}