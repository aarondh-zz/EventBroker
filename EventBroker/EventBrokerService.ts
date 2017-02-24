
/*
 *   Event Broker Service
 
 
    usage:

     ...
     import { EventBrokerService, IEventListener } from "EventBrokerService";

     @Component({
        selector: "my-listening-component",
        template: `
            <div *ngIf="indicator">I am On!</div>
            <div *ngIf="!indicator">I am Off!</div>
        `
    })
    @Injectable()
    export class MyListeningComponent implements OnDestroy {
        public indicator: boolean = false;
        private _listenListener: IEventListener;
        constructor(private _eventBroker: EventBrokerService) {
            this._listenSubscription = _eventBroker.listen<boolean>("my-event",(value:boolean)=>{
                this.indicator = value;
            });
        }
        public ngOnDestroy() {
            this._listenListener.ignore();
        }
     }

     @Component({
        selector: "my-sending-component",
        template: `
            <button (click)="canYouHearMe(true)>Turn me on</Button>
            <button (click)="canYouHearMe(false)>Turn me off</Button>
        `
    })
    @Injectable()
    export class MySendingComponent {
        constructor(private _eventBroker: EventBrokerService) {
        }
        public canYourHearMe(value:boolean) {
            _eventBroker.emit<boolean>("my-event",value);
        }
    }

 */
import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

export interface IEventListener {
    ignore(): void;
}
export interface IBrokeredEvent {
    name: string;
    emit(data: any): void;
    listen(next: (data: any) => void): IEventListener;
}
class EventListener implements IEventListener {
    constructor(private _subscription: Subscription) {
    }
    public ignore(): void {
        this._subscription.unsubscribe();
    }
}

class BrokeredEvent<T> implements IBrokeredEvent {
    private _subject: Subject<T>;
    constructor(public name: string) {
        this._subject = new Subject<T>();
    }
    public emit(data: T): void {
        this._subject.next(data);
    }
    public listen(next: (value: T) => void): IEventListener {
        return new EventListener(this._subject.subscribe(next));
    }
}
@Injectable()
export class EventBrokerService {
    private _events: { [name: string]: IBrokeredEvent };
    constructor() {
        this._events = {};
    }
    private register<T>(eventName: string): BrokeredEvent<T> {
        var event = this._events[eventName];
        if (typeof event === 'undefined') {
            event = this._events[eventName] = new BrokeredEvent<T>(eventName);
        }
        return event as BrokeredEvent<T>;
    }
    public listen<T>(eventName: string, next: (value: T) => void): IEventListener {
        return this.register<T>(eventName).listen(next);
    }
    public emit<T>(eventName: string, data: T): void {
        return this.register<T>(eventName).emit(data);
    }
}