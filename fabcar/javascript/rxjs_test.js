const { range, fromEvent, interval, timer, Subject, from, ReplaySubject} = require("rxjs");
const { of, map, filter, take, delay, toArray, merge, multicast } = require("rxjs/operators");
const { Observable} = require("rxjs/Observable");




const subjectOne = new Subject();

subjectOne.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
subjectOne.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

subjectOne.next(1);
subjectOne.next(2);

// Logs:
// observerA: 1
// observerB: 1
// observerA: 2
// observerB: 2

console.log("next");



const subject = new ReplaySubject(5);

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});

subject.next(1);
subject.next(2);
subject.next(3);
subject.next(4);

subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

subject.next(5);
subject.complete();

// Logs:
// observerA: 5
// observerB: 5

const obs = new Subject();

obs.subscribe({
    next(x) { console.log('TEST OBS NEXT '+x); },
  error(err) { console.error('something wrong occurred: ' + err); },
  complete() { console.log('done'); }

});

obs.next(" from next fun");


const source = from([1, 2, 3]);
const subjectt = new Subject();
const multicasted = source.pipe(multicast(subjectt));

// These are, under the hood, `subject.subscribe({...})`:
multicasted.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
multicasted.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

// This is, under the hood, `source.subscribe(subject)`:


subjectt.subscribe({
  next: (v) => console.log(`Got a value after ${v}`)
})
multicasted.connect();


subjectt.next("GOT IT");


console.log("\n----- OBSERVALE STREAM -----");

const streamData = from([1, 2, 3, 4, 5]).pipe(take(3));
streamData.subscribe({
    next(x) { console.log(`${x} : obtained in stream`); },
  error(err) { console.error('something wrong occurred: ' + err); }
  

});

const streamTestSubject = new ReplaySubject(10);
streamTestSubject.next(1);
streamTestSubject.next(2);
streamTestSubject.next(3);
streamTestSubject.next(4);
streamTestSubject.next(5);

streamTestSubject.subscribe({
    next(x) { console.log('TEST OBS NEXT '+x); },
  error(err) { console.error('something wrong occurred: ' + err); },
  complete() { console.log('done'); }

});
streamTestSubject.pipe(map(x => x * x));
streamTestSubject.next(6);


var x = new ReplaySubject();
y = x.asObservable();

x.next(0);

x.subscribe({
	next(x) {console.log(`printing from subject ${x}`)}
})
y.subscribe({
	next(x) {console.log(`printing from observable transformed ${x}`)}
})
y.pipe(take(2)).subscribe({
	next(x) {console.log(`printing after a pipe take 2 ${x}`)}
})

x.next(1);x.next(2);x.next(3);x.next(4);
