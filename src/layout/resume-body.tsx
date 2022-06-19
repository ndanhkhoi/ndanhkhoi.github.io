import React from 'react';
import {Col, Row} from 'reactstrap';
import {Awards, Education, Interests, Languages, Projects, Skill, WorkExperiences} from '../component';

import IResumeData from '../model/resume-data.model';

export interface IResumeBodyProps {
    resumeData: IResumeData
}

const ResumeBody: React.FC<IResumeBodyProps> = props => {

    const {resumeData} = props;

    return (
        <div className="resume-body">
            <Row>
                <Col lg={8} xl={9} className="resume-main col-12 pe-0 pe-lg-5">
                    <WorkExperiences workExperiences={resumeData.workExperiences} />
                    <Projects projects={resumeData.projects} />
                </Col>
                <Col lg={4} xl={3} tag={'aside'} className="resume-aside col-12 px-lg-4 pb-lg-4">
                    <Skill skill={resumeData.skill} />
                    <Education educations={resumeData.educations} />
                    <Awards awards={resumeData.awards} />
                    <Languages languages={resumeData.languages} />
                    <Interests interests={resumeData.interests} />
                </Col>
            </Row>
        </div>
    );

}

export default ResumeBody;