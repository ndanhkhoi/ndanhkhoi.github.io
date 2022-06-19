import React from 'react';
import github from '../assets/images/github.svg';

const ResumeFooter: React.FC<{link: string}> = ({link}) => {

    return (
        <div className="resume-footer text-center">
            <ul className="resume-social-list list-inline mx-auto mb-0 d-inline-block text-muted">
                <li className="list-inline-item mb-lg-0 me-3">
                    <a className="resume-link" href={link}>
                        <span className={'me-2'}>
                            <img src={github} alt={'github'} width={15}/>
                        </span>
                        <span className="d-none d-lg-inline-block text-muted">{link}</span>
                    </a>
                </li>
            </ul>
        </div>
    );

}

export default ResumeFooter;