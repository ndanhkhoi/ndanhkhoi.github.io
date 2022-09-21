import React from 'react';
import './App.scss';
import {RESUME_DATA} from './data';
import Resume from './resume';

const App: React.FC = () => {

    return (
        <Resume data={RESUME_DATA} />
    );
}

export default App;
