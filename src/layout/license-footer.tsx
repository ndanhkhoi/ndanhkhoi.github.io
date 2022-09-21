import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';

const LicenseFooter: React.FC = () => {

    return (
        <footer className="footer text-center py-4">
            <small className="copyright text-muted">
                Designed with <FontAwesomeIcon icon={faHeart} /> by <a className="theme-link" href="http://themes.3rdwavemedia.com" target="_blank" rel="noreferrer">Xiaoying Riley</a> for developers.
                <br />
                Customize and transfer to ReactJS by <a className="theme-link" href="https://ndanhkhoi.github.io" target="_blank" rel="noreferrer">Nguyen Duc Anh Khoi</a>
            </small>
        </footer>
    );

}

export default LicenseFooter;