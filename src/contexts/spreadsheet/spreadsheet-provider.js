import React, { createContext, useContext, useState } from "react";

const SpreadsheetContext = createContext();

export const useSpreadsheetContext = () => useContext(SpreadsheetContext);

export const SpreadsheetProvider = ({ children }) => {
    // Dictionary to hold spreadsheet data per page key.
    // Example: { 'events-bulk': { manipulator: obj, fileName: 'file.xlsx', fileHandle: File, sheetNameValue: 'Sheet1', cellRangeName: 'A2:D50' } }
    const [pageSpreadsheets, setPageSpreadsheets] = useState({});

    const saveSpreadsheetData = (pageKey, data) => {
        setPageSpreadsheets(prev => ({
            ...prev,
            [pageKey]: {
                ...prev[pageKey],
                ...data
            }
        }));
    };

    const getSpreadsheetData = (pageKey) => {
        return pageSpreadsheets[pageKey] || null;
    };

    const clearSpreadsheetData = (pageKey) => {
        setPageSpreadsheets(prev => {
            const newState = { ...prev };
            delete newState[pageKey];
            return newState;
        });
    };

    return (
        <SpreadsheetContext.Provider value={{
            saveSpreadsheetData,
            getSpreadsheetData,
            clearSpreadsheetData,
            pageSpreadsheets
        }}>
            {children}
        </SpreadsheetContext.Provider>
    );
};

export default SpreadsheetProvider;
