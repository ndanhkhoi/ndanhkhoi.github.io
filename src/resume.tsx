import React from 'react';
import {LicenseFooter, ResumeBody, ResumeFooter, ResumeHeader, ResumeIntro} from './layout';
import IResumeData from './model/resume-data.model';

export interface IResumeProps {
    data: IResumeData
}

const Resume: React.FC<IResumeProps> = ({data}) => {

    return (
        <div className="main-wrapper bg-white">
            <div className="container px-2 px-lg-5">
                <div className={'shadow-lg p-0'}>
                    <article id={'resume'} className="resume-wrapper mx-auto bg-white p-5 mb-5 my-2 my-lg-5 ">
                        <ResumeHeader personalInfomation={data.personalInfomation} />
                        <hr/>
                        <ResumeIntro sumary={data.sumary}/>
                        <hr/>
                        <ResumeBody resumeData={data} />
                        <hr/>
                    </article>
                </div>
            </div>
            <ResumeFooter link={data.github} />
            <LicenseFooter />
        </div>
    );

};

export default Resume;