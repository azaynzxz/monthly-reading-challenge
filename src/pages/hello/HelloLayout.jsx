import React from 'react';
import { Outlet } from 'react-router-dom';
import { HelloLangProvider } from '../../contexts/HelloLangContext';

/**
 * Layout wrapper for all /hello routes.
 * Provides the language context so the toggle persists
 * when navigating between /hello, /hello/shop, /hello/freebies.
 */
const HelloLayout = () => (
    <HelloLangProvider>
        <Outlet />
    </HelloLangProvider>
);

export default HelloLayout;
