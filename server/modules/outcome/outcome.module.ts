import { Module } from '@nestjs/common';
import { OutcomeController } from './outcome.controller';
import { OutcomeService } from './outcome.service';

@Module({
  controllers: [OutcomeController],
  providers: [OutcomeService],
  exports: [OutcomeService],
})
export class OutcomeModule {}
