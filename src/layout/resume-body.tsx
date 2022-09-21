import React from 'react';
import {Awards, Education, Interests, Languages, Projects, Skill, WorkExperiences} from '../component';

import IResumeData from '../model/resume-data.model';

export interface IResumeBodyProps {
    resumeData: IResumeData
}

const ResumeBody: React.FC<IResumeBodyProps> = props => {

    const {resumeData} = props;

    return (
        <div className="resume-body">
            <div className={'row'}>
                <div className="resume-main col-12 col-lg-8 col-xl-9 pe-0 pe-lg-5">
                    <WorkExperiences workExperiences={resumeData.workExperiences} />
                    <Projects projects={resumeData.projects} />
                </div>
                <aside className="resume-aside col-12 col-lg-4 col-xl-3 px-lg-4 pb-lg-4">
                    <Skill skill={resumeData.skill} />
                    <Education educations={resumeData.educations} />
                    <Awards awards={resumeData.awards} />
                    <Languages languages={resumeData.languages} />
                    <Interests interests={resumeData.interests} />
                </aside>
            </div>
        </div>
    );

}

export default ResumeBody;