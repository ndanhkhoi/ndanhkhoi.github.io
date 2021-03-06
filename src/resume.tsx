import React from 'react';
import {Container} from 'reactstrap';
import {LicenseFooter, ResumeBody, ResumeFooter, ResumeHeader, ResumeIntro} from './layout';
import IResumeData from './model/resume-data.model';

export interface IResumeProps {
    data: IResumeData
}

const Resume: React.FC<IResumeProps> = ({data}) => {

    return (
        <div className="main-wrapper bg-white">
            <Container className="px-3 px-lg-5">
                <div className={'shadow-lg p-0'}>
                    <article id={'resume'} className="resume-wrapper mx-auto bg-white p-5 mb-5 my-5 ">
                        <ResumeHeader personalInfomation={data.personalInfomation} />
                        <hr/>
                        <ResumeIntro sumary={data.sumary}/>
                        <hr/>
                        <ResumeBody resumeData={data} />
                        <hr/>
                    </article>
                </div>
            </Container>
            <ResumeFooter link={data.github} />
            <LicenseFooter />
        </div>
    );

};

export default Resume;