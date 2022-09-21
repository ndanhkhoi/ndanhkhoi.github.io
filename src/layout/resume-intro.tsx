import React from 'react';
import {ProfileImage} from '../component';
import resumeProfile from '../assets/images/resume-profile.jpg';

const ResumeIntro: React.FC<{sumary: string}> = ({sumary}) => {

    return (
        <div className="resume-intro py-3">
            <div className="row align-items-center">
                <div className="col-12 col-md-3 col-xl-2 text-center">
                    <ProfileImage src={resumeProfile} />
                </div>
                <div className="col-12 col-md-9 col-xl-10 text-start">
                    <p className="mb-0">
                        {sumary}
                    </p>
                </div>
            </div>
        </div>
    );

}

export default ResumeIntro;