const fs = require('fs');

const themes = [
  { key: 'domain', label: 'Domain & Range' },
  { key: 'types', label: 'Types of Functions' },
  { key: 'inequalities', label: 'Inequalities' },
  { key: 'limits', label: 'Limits' },
  { key: 'lateral', label: 'Lateral Limits' },
  { key: 'trig', label: 'Trigonometric Limits' }
];

const difficulties = ['easy','medium','hard'];
let questions=[];

themes.forEach(theme=>{
  difficulties.forEach(diff=>{
    for(let i=1;i<=4;i++){
      let q={theme: theme.key, difficulty: diff};
      if(theme.key==='domain'){
        const a=i+ (diff==='easy'?0:(diff==='medium'?5:10));
        q.question=`What is the domain of f(x) = 1/(x - ${a})?`;
        q.options=[`x ≠ ${a}`,`x ≥ ${a}`,`x ≤ ${a}`,`all real numbers`];
        q.answerIndex=0;
      } else if(theme.key==='types'){
        q.question=`f(x) = x^${i+1} is which type of function?`;
        q.options=['Polynomial','Rational','Exponential','Logarithmic'];
        q.answerIndex=0;
      } else if(theme.key==='inequalities'){
        const a=i + (diff==='easy'?1:(diff==='medium'?5:10));
        q.question=`Solve for x: x + ${a} > 0`;
        q.options=[`x > ${-a}`,`x < ${-a}`,`x = ${-a}`,`x ≥ ${-a}`];
        q.answerIndex=0;
      } else if(theme.key==='limits'){
        const a=i;
        q.question=`What is the limit of (x+${a}) as x approaches ${a}?`;
        q.options=[`${2*a}`,`${a}`,`0`,`∞`];
        q.answerIndex=0;
      } else if(theme.key==='lateral'){
        const a=i;
        q.question=`Evaluate the right-hand limit of |x|/x as x→${a}`;
        q.options=['1','-1','0','Does not exist'];
        q.answerIndex=0;
      } else if(theme.key==='trig'){
        const a=i;
        q.question=`Evaluate limit of sin(x)/x as x→0`;
        q.options=['1','0','∞','Does not exist'];
        q.answerIndex=0;
      }
      questions.push(q);
    }
  });
  // extra 4 easy questions
  for(let i=1;i<=4;i++){
    questions.push({
      theme: theme.key,
      difficulty:'easy',
      question:`Additional ${theme.label} question ${i}?`,
      options:['Option A','Option B','Option C','Option D'],
      answerIndex:0
    });
  }
});

fs.writeFileSync('questions.json', JSON.stringify(questions,null,2));
